var ss = SpreadsheetApp.openById('1BSKS_YE0APZC5Az364rEYyUwCyO7A3tu0wX38T6t3w0');

function doGet(e) { 
  return HtmlService.createTemplateFromFile('index').evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function checkLogin(email, username, password, mobileNumber, country, postalCode) {
  var sheet = ss.getSheetByName('Login');
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  var status;
  var otpSent = false;
  var now = new Date();
  var loginDate = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var loginTime = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');
  
  for (var i = 1; i < values.length; i++) {
    var sheetEmail = values[i][1].toString().trim();
    var sheetUsername = values[i][2].toString().trim();
    var sheetPassword = values[i][3].toString().trim();
    var sheetMobileNumber = values[i][4].toString().trim();
    var sheetCountry = values[i][5].toString().trim();
    var sheetPostalCode = values[i][6].toString().trim();
    var accessType = values[i][7].toString().trim();

    if (sheetEmail === email.trim() &&
        sheetUsername === username.trim() &&
        sheetPassword === password.trim() &&
        sheetMobileNumber === mobileNumber.trim() &&
        sheetCountry === country.trim() &&
        sheetPostalCode === postalCode.trim()) {
      
      if (accessType === 'Allow') {
        var otp = Math.floor(100000 + Math.random() * 900000).toString();
        sheet.getRange(i + 1, 9).setValue(otp); // Save OTP to column I
        sendOtpEmail(email, otp);

        status = 'Success';
        otpSent = true;
      } else {
        status = 'Access Blocked';
      }

      logLoginHistory(email, username, loginDate, loginTime, status);
      return {success: status === 'Success', otpSent: otpSent, message: status};
    }
  }
  
  logLoginHistory(email, username, loginDate, loginTime, 'Invalid credentials');
  return {success: false, message: 'Invalid credentials!'};
}

function logLoginHistory(email, username, loginDate, loginTime, status) {
  var historySheet = ss.getSheetByName('LoginHistory');
  historySheet.appendRow([email, username, loginDate, loginTime, status]);
}

function verifyOtp(email, otp) {
  var sheet = ss.getSheetByName('Login');
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();

  for (var i = 1; i < values.length; i++) {
    var sheetEmail = values[i][1].toString().trim();
    var sheetOtp = values[i][8].toString().trim();

    if (sheetEmail === email.trim() && sheetOtp === otp.trim()) {
      var userData = {
        username: values[i][2].toString().trim(),
        email: values[i][1].toString().trim(),
        mobileNumber: values[i][4].toString().trim(),
        country: values[i][5].toString().trim(),
        postalCode: values[i][6].toString().trim()
      };

      sheet.getRange(i + 1, 9).setValue(''); // Clear the OTP in column I
      var sheetsToCheck = [];
      for (var j = 9; j <= 12; j++) {
        var sheetName = values[i][j].toString().trim();
        if (sheetName && sheetName !== "Blocked") {
          sheetsToCheck.push(sheetName);
        }
      }
      var combinedData = getDataFromSheets(sheetsToCheck);
      logLoginHistory(email, userData.username, new Date(), 'OTP Verified');
      return {success: true, userData: userData, data: combinedData};
    }
  }
  logLoginHistory(email, '', new Date(), 'Invalid OTP');
  return {success: false, message: 'Invalid OTP!'};
}

function getDataFromSheets(sheetNames) {
  var data = [];
  sheetNames.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      var values = sheet.getDataRange().getValues();
      for (var i = 1; i < values.length; i++) {
        data.push({
          title: values[i][0],
          text: values[i][1],
          url: values[i][2],
          fileUrl: values[i][3]
        });
      }
    }
  });
  return data;
}


function sendOtpEmail(email, otp) {
  var subject = "Appscript VIP Membership Login - Your OTP Code";
  var message = 
    "Dear Valued Member,\n\n" +
    "Thank you for being a part of the Astoe VIP Membership program. To complete your login process, please use the One-Time Password (OTP) provided below:\n\n" +
    "Your OTP code: " + otp + "\n\n" +
    "Please enter this code within the next 10 minutes to ensure a secure login. If you did not request this OTP, please disregard this email or contact our support team immediately.\n\n" +
    "For any assistance, feel free to reach out to us at +923224083545.\n\n" +
    "Best Regards,\n" +
    "The Rameez Appscript Team Team\n\n" +
    "Apps Script Team\n" +
    "Website: www.mrameezimdad.blogspot.com\n" +
    "Contact: +923224083545,";

  MailApp.sendEmail(email, subject, message);
}


function checkSession() {
  var cache = CacheService.getUserCache();
  var sessionEmail = cache.get('sessionEmail');
  return sessionEmail ? {loggedIn: true, email: sessionEmail} : {loggedIn: false};
}

function logout() {
  var cache = CacheService.getUserCache();
  cache.remove('sessionEmail');
  return {success: true, message: 'Logged out successfully.'};
}




function getFAQDataFromSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('FAQS');
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  var range = sheet.getRange("B2:" + sheet.getRange(lastRow, lastColumn).getA1Notation());
  var values = range.getValues();
  
  var FAQData = [];
  values.forEach(function(row) {
    var question = row[0];
    var answer = [];
    for (var i = 1; i < row.length; i++) {
      if (row[i] !== "") {
        answer.push(row[i]);
      } else {
        break; // Stop adding points if an empty cell is encountered
      }
    }
    FAQData.push({ question: question, answer: answer });
  });
  
  return FAQData;
}

function getDataYoutube() {
  var sheetId = '1ct_1jvjlUArB1-YhZTAaL7pCRXguZhdGU2LHS94A8Jo'; // Replace with your actual sheet ID
  var sheetName = 'Sheet1'; // Replace with your actual sheet name
  
  var sheet = SpreadsheetApp.openById(sheetId).getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  data.shift(); // Remove the header row
  return data;
}
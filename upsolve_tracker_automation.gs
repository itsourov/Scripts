/**
 * main code is copied from Individual Contest Tracker Script,DIU ACM 
 * modified by: Sourov Biswas
 */
const CONTEST_ROW = 11;
const CONTEST_COLUMN = 1;
const USER_COLUMN = 5;

const CF_ROW = 4;
const VJ_ROW = 6;
const ATCODER_ROW = 5;




function updateAllCFData() {
  var sheet = SpreadsheetApp.getActive().getActiveSheet();

  for (var i = CONTEST_ROW; i <= sheet.getLastRow(); i += 1) {
    var contest = sheet.getRange(i, CONTEST_COLUMN);

    var url = contest.getRichTextValue().getLinkUrl();
    if (!url) continue;

    var platform = url.split('/')[2];
    if (platform !== 'codeforces.com') continue;

    var contestID = url.split('/')[4];
    var contestName = contest.getValue();
    var row = i;

    for (var j = USER_COLUMN; j <= sheet.getLastColumn(); j++) {
      var profileCell = sheet.getRange(CF_ROW, j);


      if (profileCell.getValue() === 'cf-handle' || profileCell.getValue() === '') continue;

      var profileUrl = profileCell.getRichTextValue().getLinkUrl();
      var handle = profileUrl.split('/')[4];


      var response = UrlFetchApp.fetch(`http://codeforces.com/api/contest.status?contestId=${contestID}&handle=${handle}`);
      if (response.getResponseCode() == 200) {
        var data = JSON.parse(response);
        var result = data.result;

        var solve = [];
        var upsolve = [];
        var tp = false;
        var status = false;
        result.forEach((problem, index) => {
          var participantType = problem.author.participantType;
          if (participantType === "CONTESTANT") status = true;

          if (problem["verdict"] === "OK") {
            var problemID = problem["problem"]["index"];
            if ((participantType === "CONTESTANT" || participantType === "OUT_OF_COMPETITION") && !solve.includes(problemID)) {
              solve.push(problemID);
              tp = true;
              if (upsolve.includes(problemID)) {
                var problemIndex = upsolve.indexOf(problemID);
                upsolve.splice(problemIndex, 1);
              }
            }
            else if ((participantType === "PRACTICE" || participantType === "VIRTUAL") && (!solve.includes(problemID) && !upsolve.includes(problemID))) {
              upsolve.push(problemID);
            }
          }
        })

        var solve_count = solve.length;
        var upsolve_count = upsolve.length;


        // var solveCell = sheet.getRange(row, j);
        // var upsolveCell = sheet.getRange(row, j + 1);

        // if (solve_count === 0 && !tp) solve_count = "A";
        // if (upsolve_count === 0) upsolve_count = "";
        // if (solve_count === "A" && status === true) solve_count = "0";

        // solveCell.setValue(solve_count);
        // upsolveCell.setValue(upsolve_count);


        var total_solve = solve_count + upsolve_count;
        var totalSolveCell = sheet.getRange(row, j + 1);
        var requiredSolveCell = sheet.getRange(row, j);
        totalSolveCell.setValue(total_solve);



      }
    }

    SpreadsheetApp.getUi().alert(`Updated all users data for contest ${contestName}`);
    Logger.log(`Updated all users data for contest ${contestName}`);
  }
}



function updateAllAtcoderData() {
  var sheet = SpreadsheetApp.getActive().getActiveSheet();

  for (var i = CONTEST_ROW; i <= sheet.getLastRow(); i += 1) {
    var contest = sheet.getRange(i, CONTEST_COLUMN);
    if (contest.getValue() == false) break;

    var url = contest.getRichTextValue().getLinkUrl();
    if (!url) continue;

    var platform = url.split('/')[2];
    if (platform !== 'atcoder.jp') continue;

    var type = url.split('/')[3];
    if (type !== "contests") continue;

    var contestID = url.split('/')[4];
    var response = UrlFetchApp.fetch(`https://kenkoooo.com/atcoder/resources/contests.json`);
    var contestTime;
    var contestDuration;
    if (response.getResponseCode() == 200) {
      var data = JSON.parse(response);
      for (var j = 0; j < data.length; j++) {
        if (data[j].id == contestID) {
          contestTime = data[j].start_epoch_second;;
          contestDuration = data[j].duration_second;;
          break;
        }
      }
    }
    else continue;

    contestEnd = contestTime + contestDuration;
    var contestName = contest.getValue();
    var row = i;

    for (var j = USER_COLUMN; j <= sheet.getLastColumn(); j++) {
      var profileCell = sheet.getRange(ATCODER_ROW, j);
      if (profileCell.getValue() == '' || profileCell.getValue() == null) continue;
      var profileUrl = profileCell.getRichTextValue().getLinkUrl();

      var userid = profileUrl.split('/')[4];
      var solve = [];
      var upsolve = [];
      var status = false;

      response = UrlFetchApp.fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${userid}&from_second=${contestTime}`);
      // response = UrlFetchApp.fetch(`https://kenkoooo.com/atcoder/atcoder-api/results?user=${userid}`);

      if (response.getResponseCode() === 200) {
        var data = JSON.parse(response);
        for (var k = 0; k < data.length; k++) {
          if (data[k].contest_id === contestID) {
            var submission = data[k].epoch_second;
            var problem = data[k].problem_id;
            var result = data[k].result;
            if (submission >= contestTime && submission <= contestEnd) {
              status = true;
              if (result === 'AC' && !solve.includes(problem)) solve.push(problem);
            }
            else {
              if (result === 'AC' && !upsolve.includes(problem)) upsolve.push(problem);
            }
          }
        }
      }

      var solve_count = solve.length;
      var upsolve_count = upsolve.length;

      // var solveCell = sheet.getRange(row, j);
      // var upsolveCell = sheet.getRange(row, j + 1);

      // if (solve_count == '0' && !status) solve_count = 'A';
      // if (upsolve_count == '0') upsolve_count = '';

      // solveCell.setValue(solve_count);
      // upsolveCell.setValue(upsolve_count);

      var total_solve = solve_count + upsolve_count;
      var totalSolveCell = sheet.getRange(row, j + 1);
      var requiredSolveCell = sheet.getRange(row, j);
      totalSolveCell.setValue(total_solve);


    }
    SpreadsheetApp.getUi().alert(`Updated all users data for contest ${contestName}`);
    Logger.log(`Updated all users data for contest ${contestName}`);
  }
}



function updateAllVjudgeData() {
  var sheet = SpreadsheetApp.getActive().getActiveSheet();

  var userColumnIndexMap = {};
  var handleList = [];
  for (var i = USER_COLUMN; i <= sheet.getLastColumn(); i++) {
    var vjHandle = sheet.getRange(VJ_ROW, i).getValue();
    if (vjHandle == '' || vjHandle == null) continue;
    userColumnIndexMap[vjHandle] = i;
    handleList.push(vjHandle);
  }

  var col = CONTEST_COLUMN;
  for (var r = CONTEST_ROW; r <= sheet.getLastRow(); r++) {
    var row = r;

    var cell = sheet.getRange(row, col);

    var url = cell.getRichTextValue().getLinkUrl();
    if (!url) continue;

    var platform = url.split('/')[2];
    if (platform !== "vjudge.net") continue;

    var contestName = cell.getValue();
    var contestId = url.split('/')[4];

    try {


      var vjContestData = vjudgeDataProcess(contestId);

      for (var i = 0; i < handleList.length; i++) {
        // if (vjContestData[handleList[i]]) {
        //   sheet.getRange(row, userColumnIndexMap[handleList[i]]).setValue(vjContestData[handleList[i]].isPresent ? vjContestData[handleList[i]].contestSolve : 'A');
        //   if (vjContestData[handleList[i]].upSolve)
        //     sheet.getRange(row, userColumnIndexMap[handleList[i]] + 1).setValue(vjContestData[handleList[i]].upSolve);
        // }
        // else {
        //   sheet.getRange(row, userColumnIndexMap[handleList[i]]).setValue('A');
        // }
        sheet.getRange(row, userColumnIndexMap[handleList[i]] + 1).setValue((vjContestData[handleList[i]]?.upSolve ?? 0) + (vjContestData[handleList[i]]?.contestSolve ?? 0));




      }
      Logger.log("Finished Running Script For Contest: " + contestName);
      SpreadsheetApp.getUi().alert("Finished Running Script For Contest: " + contestName);
    } catch (e) {
      Logger.log("Error Running Script For Contest: " + contestName);
      Logger.log(e);
      SpreadsheetApp.getUi().alert("Error Running Script For Contest: " + contestName);
    }
  }
}

function vjudgeDataProcess(contestId) {
  var responseData = getVjudgeData(contestId);
  // Logger.log(responseData);
  var time = parseInt(responseData.length) / 1000;
  var participants = responseData.participants;
  var participantsData = participants;
  var submissions = responseData.submissions;
  var participanrsObj = Object.entries(participants);
  participanrsObj.forEach(element => {
    var dist = {
      participantId: element[0],
      userName: element[1][0],
      name: element[1][1],
      solveCount: 0,
      upSolveCount: 0,
      isPresent: false,
      solves: problemIndexGenerate(),
    }
    participantsData[element[0]] = dist
  });
  submissions.forEach(e => {
    if (e[2] == 1) {
      if (participantsData[e[0]].solves[e[1]] == 0) {
        participantsData[e[0]].solves[e[1]] = 1
        if (e[3] > time) {
          participantsData[e[0]].upSolveCount += 1
        } else {
          participantsData[e[0]].solveCount += 1
          participantsData[e[0]].isPresent = true
        }
      }
    }
    else {
      if (e[3] <= time) participantsData[e[0]].isPresent = true
    }
  });
  var data = {}
  participanrsObj.forEach(e => {
    var tmp = {
      userid: e[0],
      userName: participantsData[e[0]].userName,
      contestSolve: participantsData[e[0]].solveCount,
      upSolve: participantsData[e[0]].upSolveCount,
      isPresent: participantsData[e[0]].isPresent
    }
    data[participantsData[e[0]].userName] = tmp
  });
  return data;
}

function getVjudgeData(contestId) {
  var formData = {
    'username': '', //use your vjudge account
    'password': ''
  };
  var options = {
    'method': 'post',
    'payload': formData,
    'User-Agent': 'PostmanRuntime/7.26.10',
  };
  var start = new Date();
  var response = UrlFetchApp.fetch('https://vjudge.net/user/login', options);
  var headers = response.getAllHeaders();
  var cookies = headers['Set-Cookie'];
  if (!cookies) {
    cookies = [];
  } else if (!Array.isArray(cookies)) {
    cookies = [cookies];
  }


  for (var i = 0; i < cookies.length; i++) {
    cookies[i] = cookies[i].split(';')[0];
  }
  var options2 = {
    'method': 'get',
    "headers": {
      "Cookie": cookies.join(';')
    },
    'User-Agent': 'PostmanRuntime/7.26.10'
  };
  var apiUrl = 'https://vjudge.net/contest/rank/single/' + contestId;
  var response = UrlFetchApp.fetch(apiUrl, options2);
  Logger.log(apiUrl);
  return JSON.parse(response);
}

function problemIndexGenerate() {
  var totalProblem = 50;
  if (totalProblem == null || totalProblem == '') totalProblem = 30;
  var dist = {};
  for (var i = 0; i < totalProblem; i++) dist[i] = 0;
  return dist;
}



function updateAll() {
  updateAllCFData();
  updateAllAtcoderData();
  updateAllVjudgeData();
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Update Count')
    .addItem('Update All', 'updateAll')
    .addItem('Update all Atcoder', 'updateAllAtcoderData')
    .addItem('Update all Codeforces', 'updateAllCFData')
    .addItem('Update all Vjudge', 'updateAllVjudgeData')
    .addToUi();
}

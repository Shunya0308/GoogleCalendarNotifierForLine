//実行処理
function main() {
  setTrigger();
  var startDate = new Date();
  var today = new Date().getDay();
  var period = (today === 1) ? 7 : 1;

  //明日の予定から通知したい場合はコメントアウト外す
  // startDate.setDate(startDate.getDate() + 1);

  var schedule = getSchedule(startDate, period);
  var message = scheduleToMessage(schedule, startDate, period);

  sendToLINE(message);
}

// 6:30 にトリガーを設定する
function setTrigger() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(6);
  date.setMinutes(30); 
  ScriptApp.newTrigger('main').timeBased().at(date).create();  
}

// Google カレンダーから予定取得
function getSchedule(startDate, period) {
  var calendarIDs = ['user@example.com']; // カレンダー ID の配列(基本は自分の登録しているメールアドレス)

  var schedule = Array.from({ length: calendarIDs.length }, () => Array(period));

  for (var iCalendar = 0; iCalendar < calendarIDs.length; iCalendar++) {
    var calendar = CalendarApp.getCalendarById(calendarIDs[iCalendar]);

    var date = new Date(startDate);
    for (var iDate = 0; iDate < period; iDate++) {
      schedule[iCalendar][iDate] = getDayEvents(calendar, date);
      date.setDate(date.getDate() + 1);
    }
  }

  return schedule;
}

// 日付ごとに予定の格納
function getDayEvents(calendar, date) {
  var dayEvents = '';
  var events = calendar.getEventsForDay(date);

  // 予定の個数分ループ処理
  for (var iEvent = 0; iEvent < events.length; iEvent++) {
    var event = events[iEvent];
    var title = event.getTitle();
    var startTime = _HHmm(event.getStartTime());
    var endTime = _HHmm(event.getEndTime());

    dayEvents = dayEvents + '・' + startTime + '-' + endTime + ' ' + title + '\n';
  }

  return dayEvents;
}

//通知するメッセージを設定
function scheduleToMessage(schedule, startDate, period) {
  const now = new Date();
  const today = new Date().getDay();
  let body = '';
  if (today === 1) {
    body = '\n1週間の予定\n'
      + `(${_Md(now)} ${_HHmm(now)}時点)\n`
      + '--------------------\n'; 
  } else {
    body = '\n今日の予定\n'
      + `(${_Md(now)} ${_HHmm(now)}時点)\n`
      + '--------------------\n';
  }

  let date = new Date(startDate);
  for (let iDay = 0; iDay < period; iDay++) {
    body = body + `${_Md(date)}(${_JPdayOfWeek(date)})\n`;
    for (let iCalendar = 0; iCalendar < schedule.length; iCalendar++) {
      if (schedule[iCalendar][iDay] === "" && today !== 0) {
        body += '今日の予定はありません。';
      } else {
        body = body + schedule[iCalendar][iDay];
      }   
    }
    date.setDate(date.getDate() + 1);
    body = body + '\n';
  }

  return body;
}

// LINE通知
function sendToLINE(message) {
  const token = 'xxxxxxxxxx'; // LINE Notifyのトークン
  const options = {
    method: 'post',
    payload: `message=${message}`,
    headers: { Authorization: `Bearer ${token}` },
  };

  UrlFetchApp.fetch('https://notify-api.line.me/api/notify', options);
}

// 日付指定の関数
function _HHmm(date) {
  return Utilities.formatDate(date, 'JST', 'HH:mm');
}

function _Md(date) {
  return Utilities.formatDate(date, 'JST', 'M/d');
}

function _JPdayOfWeek(date) {
  const dayStr = ['日', '月', '火', '水', '木', '金', '土'];
  const dayOfWeek = date.getDay();

  return dayStr[dayOfWeek];
}
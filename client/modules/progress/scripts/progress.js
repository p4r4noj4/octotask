Template.Progress.onCreated(function () {
   //TODO(vucalur): Performance - no need to fetch if landed here from issues view
   Meteor.fetchAllIssues();
});

Template.MilestoneItem.events({
   'click #showProgress': function () {
      var milestoneData = Template.currentData();

      if (!milestoneData.due_on) {
         alert('This milestone has no "due on" date!');
         return;
      }
      var milestoneIssues = getMilestoneIssues(milestoneData);
      if (!costSetForAll(milestoneIssues)) {
         alert('Some milestone issues don\'t have cost estimates');
         return;
      }
      var ret1 = calculateCostDecreaseByDay(milestoneIssues, milestoneData);
      var totalMilestoneCost = ret1.totalMilestoneCost;
      var costDecreaseByDay = ret1.costDecreaseByDay;

      var ret2 = calculateChartData(costDecreaseByDay, totalMilestoneCost);
      var idealBurn = ret2.idealBurn;
      var actualBurn = ret2.actualBurn;
      var consecutiveMilestoneDaysReadable = makeReadable(ret2.consecutiveMilestoneDays);
      drawChart(consecutiveMilestoneDaysReadable, idealBurn, actualBurn, milestoneData.title);
   }
});

function getMilestoneIssues(milestoneData) {
   var allIssues = Session.get('allIssues');
   var milestoneIssues = allIssues.filter(function (issue) {
      if (issue.milestone && issue.milestone.number === milestoneData.number) {
         return true;
      }
   });
   return milestoneIssues;
}

function costSetForAll(issues) {
   for (var i = 0, l = issues.length; i < l; i++) {
      var cost = issues[i].cost;
      if (!cost) {
         return false;
      }
   }
   return true;
}

function calculateCostDecreaseByDay(milestoneIssues, milestoneData) {
   var totalMilestoneCost = 0;
   var costDecreaseByDay = initMilestoneSpan(milestoneIssues, milestoneData);
   milestoneIssues.forEach(function (issue) {
      var cost = issue.cost;
      totalMilestoneCost += cost;
      if (issue.state === 'closed') {
         costDecreaseByDay[extractDate(issue.closed_at)] += cost;
      }
   });
   return {totalMilestoneCost: totalMilestoneCost, costDecreaseByDay: costDecreaseByDay};
}

function initMilestoneSpan(milestoneIssues, milestoneData) {
   var milestoneStart = oldestCreationDate(milestoneIssues);
   var milestoneEnd = new Date(milestoneData.due_on);
   removeTime(milestoneStart);
   removeTime(milestoneEnd);

   var result = {};
   for (var date = milestoneStart; date <= milestoneEnd; incByOneDay(date)) {
      result[date] = 0;
   }
   return result;
}

function oldestCreationDate(issues) {
   var oldestDate = now();
   issues.forEach(function (issue) {
      var date = new Date(issue.created_at);
      if (date < oldestDate) {
         oldestDate = date;
      }
   });
   return oldestDate;
}

function now() {
   return new Date();
}

function removeTime(date) {
   date.setHours(0, 0, 0);
}

function incByOneDay(date) {
   date.setDate(date.getDate() + 1);
}

function extractDate(timestamp_str) {
   var date = new Date(timestamp_str);
   removeTime(date);
   return date;
}

function calculateChartData(costDecreaseByDay, totalMilestoneCost) {
   var consecutiveMilestoneDays = Object.keys(costDecreaseByDay); // keys() outcome is sorted in this case
   var l = consecutiveMilestoneDays.length;
   var idealBurn = new Array(l);
   var actualBurn = new Array(l);
   var idealDailyBurn = totalMilestoneCost / l;
   for (var i = 0; i < l; i++) {
      idealBurn[i] = (i == 0 ? totalMilestoneCost : idealBurn[i - 1]) - idealDailyBurn;
      actualBurn[i] = (i == 0 ? totalMilestoneCost : actualBurn[i - 1])
         - costDecreaseByDay[consecutiveMilestoneDays[i]];
   }
   return {consecutiveMilestoneDays: consecutiveMilestoneDays, idealBurn: idealBurn, actualBurn: actualBurn};
}

function makeReadable(consecutiveMilestoneDays) {
   var locale = "en-us";
   var consecutiveMilestoneDaysReadable = consecutiveMilestoneDays.map(function (dateStr) {
      var date = new Date(dateStr);
      var monthName = date.toLocaleString(locale, {month: "short"});
      return date.getDate() + ' ' + monthName;
   });
   return consecutiveMilestoneDaysReadable;
}

function drawChart(consecutiveMilestoneDaysReadable, idealBurn, actualBurn, milestoneTitle) {
// from http://codepen.io/dganoff/pen/lHvmd
   var chartOptions = {
      title: {
         text: 'Burndown Chart',
         x: -20 //center
      },
      colors: ['blue', 'red'],
      plotOptions: {
         line: {
            lineWidth: 3
         },
         tooltip: {
            hideDelay: 200
         }
      },
      subtitle: {
         text: 'Milestone: ' + milestoneTitle,
         x: -20
      },
      xAxis: {
         categories: consecutiveMilestoneDaysReadable
      },
      yAxis: {
         title: {
            text: 'Hours'
         },
         plotLines: [{
            value: 0,
            width: 1
         }]
      },
      tooltip: {
         valueSuffix: ' hrs',
         crosshairs: true,
         shared: true
      },
      legend: {
         layout: 'vertical',
         align: 'right',
         verticalAlign: 'middle',
         borderWidth: 0
      },
      series: [{
         name: 'Ideal Burn',
         color: 'rgba(255,0,0,0.25)',
         lineWidth: 2,
         data: idealBurn
      }, {
         name: 'Actual Burn',
         color: 'rgba(0,120,200,0.75)',
         marker: {
            radius: 6
         },
         data: actualBurn
      }],
      chart: {
         renderTo: 'chart'
      }
   };
   var chart = new Highcharts.Chart(chartOptions);
}

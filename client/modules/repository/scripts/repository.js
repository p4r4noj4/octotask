Session.setDefault('allIssues', []);
Session.setDefault('milestones', []);
Session.setDefault('activeIssueFilter', {});

Template.registerHelper('milestones', function () {
   Meteor.call('getRepoMilestones', Router.current().params.reponame, Router.current().params.username, function (error, result) {
      Session.set('milestones', result);
   });
   return Session.get('milestones');
});

Template.registerHelper('collaborators', function () {
   Meteor.call('getRepoCollaborators', Router.current().params.reponame, Router.current().params.username, function (error, result) {
      Session.set('collaborators', result);
   });
   return Session.get('collaborators') || [];
});

Template.Repository.onCreated(function () {
   Meteor.call('getRepoIssues', Router.current().params.reponame, Router.current().params.username, function (error, result) {
      Session.set('allIssues', result);
   });
});

Template.Repository.helpers({
   filteredIssues: function () {
      var allIssues = Session.get('allIssues');
      var activeIssueFilter = Session.get('activeIssueFilter');
      return filtered(allIssues, activeIssueFilter);
   }
});

function filtered(issues, issueFilter) {
   var predicate = function (issue) {
      return isSubset(issue, issueFilter);
   }
   return issues.filter(predicate);
}

function isSubset(obj, subset) {
   'use strict';

   if (subset === null || subset === undefined) {
      return true;
   }
   if (obj === null || obj === undefined) {
      return false;
   }
   if (!(subset instanceof  Object)) {
      return obj === subset || obj.valueOf() === subset.valueOf();
   }
   // recursive object inclusiveness
   var p = Object.keys(obj);
   return Object.keys(subset).every(function (i) {
         return p.indexOf(i) !== -1;
      }) &&
      Object.keys(subset).every(function (i) {
         return isSubset(obj[i], subset[i]);
      });
}

Template.IssuesFiler.events({
   'change #filter select': function (event, template) {
      var milestoneNumber = Template.instance().$('#milestone option:selected:not([default-marker]) #milestoneNumber').text();
      var assignee = Template.instance().$('#assignee option:selected:not([default-marker])').text();

      updateFilter(milestoneNumber, assignee);
   }
});

function updateFilter(milestoneNumber, assignee) {
   var newFilter = constructFilter(milestoneNumber, assignee);
   Session.set('activeIssueFilter', newFilter);
}

function constructFilter(milestoneNumber, assignee) {
   var filter = {};
   if (!allMilestonesSelected(milestoneNumber)) {
      filter.milestone = {number: parseInt(milestoneNumber)};
   }
   if (!allAssigneesSelected(assignee)) {
      filter.assignee = {login: assignee};
   }
   return filter;

   function allMilestonesSelected(milestoneNumber) {
      // implementation assumes proper jQuery selector and 'All' option to be the default one
      return !milestoneNumber;
   }

   function allAssigneesSelected(assignee) {
      // implementation assumes proper jQuery selector and 'All' option to be the default one
      return !assignee;
   }
}

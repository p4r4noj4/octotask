Session.setDefault('allIssues', []);
Session.setDefault('milestones', []);
Session.setDefault('activeFilters', {});

Template.registerHelper('milestones', function () {
   Meteor.call('getRepoMilestones', Router.current().params.reponame, Router.current().params.username, function (error, result) {
      Session.set('milestones', result);
   });
   return Session.get('milestones');
});

Template.Repository.onCreated(function () {
   Meteor.call('getRepoIssues', Router.current().params.reponame, Router.current().params.username, function (error, result) {
      Session.set('allIssues', result);
   });
});

Template.Repository.helpers({
   filteredIssues: function () {
      var allIssues = Session.get('allIssues');
      var activeFilters = Session.get('activeFilters');
      return filtered(allIssues, activeFilters);
   }
});


function filtered(allIssues, activeFilters) {
   var result = [];
   allIssues.forEach(function (issue) {
      var matches = true;
      for (var prop in activeFilters) {
         //TODO(vucalur): fix - not working for arbitrary number of property levels
         if (!isSubset(activeFilters[prop], issue[prop])) {
            matches = false;
         }
      }
      if (matches) {
         result.push(issue);
      }
   });
   return result;
}

//TODO(vucalur): fix - won't work for arbitrary number of property levels
function isSubset(subset, obj) {
   for (var prop in subset) {
      if (!obj || subset[prop] !== obj[prop]) {
         return false;
      }
   }

   return true;
}

Template.IssuesFilers.events({
   'change #filters select': function (event, template) {
      var milestoneSelect = Template.instance().$("#milestone");
      var milestoneNumber = milestoneSelect.find(' option:selected #milestoneNumber').text();

      var updatedFilters = Session.get('activeFilters');

      if (allMilestonesSelected(milestoneNumber)) {
         delete updatedFilters.milestone;
      } else {
         updatedFilters.milestone = {number: parseInt(milestoneNumber)};
      }

      function allMilestonesSelected(milestoneNumber) {
         return !milestoneNumber;
      }

      Session.set('activeFilters', updatedFilters);
   }
});
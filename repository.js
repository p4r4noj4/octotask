if (Meteor.isClient) {

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

   Template.CreateIssue.onCreated(function () {
      this.createDisabled = new ReactiveVar(true);
   });

   Template.CreateIssue.events({
      'click #createIssue': function (event, template) {
         //TODO(vucalur): DRY
         var titleInput = Template.instance().$("#title");
         var bodyInput = Template.instance().$("#issueCommentBody");
         var assigneeSelect = Template.instance().$("#assignee");
         var milestoneSelect = Template.instance().$("#milestone2");

         var title = titleInput.val();
         var body = bodyInput.val();
         var assignee = assigneeSelect.val();
         var milestoneNumber = milestoneSelect.find(' option:selected #milestoneNumber').text();

         Meteor.call('createIssue',
            Router.current().params.reponame,
            Router.current().params.username,
            title,
            body,
            assignee,
            milestoneNumber,
            function (error, newIssue) {
               var updatedAllIssues = Session.get('allIssues');
               updatedAllIssues.push(newIssue);
               Session.set('allIssues', updatedAllIssues);

               titleInput.val('');
               bodyInput.val('');
               assigneeSelect.prop('selectedIndex', 0);
               milestoneSelect.prop('selectedIndex', 0);
            });
      }
   });

   Template.CreateIssue.helpers({
      collaborators: function () {
         Meteor.call('getRepoCollaborators', Router.current().params.reponame, Router.current().params.username, function (error, result) {
            Session.set('collaborators', result);
         });
         return Session.get('collaborators') || [];
      }
   });

   function getIssueId(issueTemplate) {
      return issueTemplate.currentData().number;
   }

   Template.IssueItem.events({
      'click #showComments': function () {
         $("#" + Template.instance().commentsId.get()).collapse('toggle');
      },
      'click #addComment': function (event, template) {
         var bodyInput = $("#" + Template.instance().commentsId.get() + " #commentBody");
         var body = bodyInput.val();

         var commentsReactiveVar = Template.instance().comments;
         Meteor.call('createComment',
            Router.current().params.reponame,
            Router.current().params.username,
            getIssueId(Template),
            body,
            function (error, newComment) {
               var updatedComments = commentsReactiveVar.get();
               updatedComments.push(newComment);
               commentsReactiveVar.set(updatedComments);
               bodyInput.val('');
            });
      },
      'show.bs.collapse': function () {
         var commentsReactiveVar = Template.instance().comments;
         Meteor.call('getIssueComments', Router.current().params.reponame, Router.current().params.username, getIssueId(Template), function (error, result) {
            commentsReactiveVar.set(result);
         });
      }
   });


   Template.IssueItem.onCreated(function () {
      //TODO(p4r4noj4): currentData().number vs. currentData().id.toString(). Establish convention
      var commentsId = "commentsPanel" + Template.currentData().id.toString();
      this.commentsId = new ReactiveVar(commentsId);

      this.comments = new ReactiveVar([]);
      $("#" + this.commentsId.get()).collapse({parent: ".allIssues"});
   });

   Template.IssueItem.helpers({
      commentsId: function () {
         return Template.instance().commentsId.get();
      },
      comments: function () {
         return Template.instance().comments.get();
      }
   })

}
if (Meteor.isClient) {

   Session.setDefault('issues', []);

   Template.Repository.helpers({
      issues: function () {
         Meteor.call('getRepoIssues', Router.current().params.reponame, Router.current().params.username, function (error, result) {
            Session.set('issues', result);
         });
         return Session.get('issues');
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
         var assigneeInput = Template.instance().$("#assignee");

         var title = titleInput.val();
         var body = bodyInput.val();
         var assignee = assigneeInput.val();

         Meteor.call('createIssue',
            Router.current().params.reponame,
            Router.current().params.username,
            title,
            body,
            assignee,
            function (error, newIssue) {
               var updatedIssues = Session.get('issues');
               updatedIssues.push(newIssue);
               Session.set('issues', updatedIssues);

               titleInput.val('');
               bodyInput.val('');
               assigneeInput.val('');
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
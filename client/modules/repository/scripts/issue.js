function getIssueId(issueTemplate) {
   return issueTemplate.currentData().number;
}

function updateIssues(updatedIssue, allIssues) {
   for (var i = 0, l = allIssues.length; i < l; i++) {
      if (allIssues[i].number === updatedIssue.number) {
         allIssues[i] = updatedIssue;
         break;
      }
   }
}

Template.IssueItem.events({
   'click #showComments': function () {
      $("#" + Template.instance().commentsId.get()).collapse('toggle');
   },
   'click #closeIssue': function () {
      Meteor.call('closeIssue',
         Router.current().params.reponame,
         Router.current().params.username,
         getIssueId(Template),
         function (error, closedIssue) {
            var allIssues = Session.get('allIssues');
            updateIssues(closedIssue, allIssues);
            Session.set('allIssues', allIssues);


         });
   },
   'click #editIssue': function() {
      Template.instance().inEdition.set(true);
   },
   'click #cancelEdit': function() {
      Template.instance().inEdition.set(false);
   },
   'click #saveEdit': function() {
      Template.instance().inEdition.set(false);
      var costInput = Template.instance().$("#cost");
      var priorityInput = Template.instance().$("#priority");
      var cost = parseInt(costInput.val());
      var priority = parseInt(priorityInput.val());

      Meteor.call('updateIssue',
         Router.current().params.reponame,
         Router.current().params.username,
         this.number,
         cost,
         priority,
         function (error, updatedIssue) {
            var allIssues = Session.get('allIssues');
            for (var i = 0, l = allIssues.length; i < l; i++) {
               if (allIssues[i].number === updatedIssue.number) {
                  allIssues[i].cost = updatedIssue.cost;
                  allIssues[i].priority = updatedIssue.priority;
                  break;
               }
            }
            Session.set('allIssues', allIssues);
         });

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
   this.inEdition = new ReactiveVar(false);
   $("#" + this.commentsId.get()).collapse({parent: ".allIssues"});
});

Template.IssueItem.helpers({
   commentsId: function () {
      return Template.instance().commentsId.get();
   },
   comments: function () {
      return Template.instance().comments.get();
   },
   inEdition: function() {
      return Template.instance().inEdition.get();
   }
});
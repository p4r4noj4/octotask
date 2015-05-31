function getIssueId(issueTemplate) {
   return issueTemplate.currentData().number;
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
            updateAllIssues(closedIssue);
            Session.set('allIssues', allIssues);

            function updateAllIssues(closedIssue) {
               for (var i = 0, l = allIssues.length; i < l; i++) {
                  if (allIssues[i].number === closedIssue.number) {
                     allIssues[i] = closedIssue;
                     break;
                  }
               }
            }
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
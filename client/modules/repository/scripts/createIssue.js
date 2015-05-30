Template.CreateIssue.onCreated(function () {
   this.createDisabled = new ReactiveVar(true);
});

Template.CreateIssue.events({
   'click #createIssue': function (event, template) {
      //TODO(vucalur): DRY
      var titleInput = Template.instance().$("#title");
      var bodyInput = Template.instance().$("#issueCommentBody");
      var costInput = Template.instance().$("#cost");
      var priorityInput = Template.instance().$("#priority");
      var assigneeSelect = Template.instance().$("#assignee2");
      var milestoneSelect = Template.instance().$("#milestone2");

      var title = titleInput.val();
      var body = bodyInput.val();
      var cost = parseInt(costInput.val());
      var priority = parseInt(priorityInput.val());
      var assignee = assigneeSelect.val();
      var milestoneNumber = milestoneSelect.find(' option:selected #milestoneNumber').text();

      Meteor.call('createIssue',
         Router.current().params.reponame,
         Router.current().params.username,
         title,
         body,
         cost,
         priority,
         assignee,
         milestoneNumber,
         function (error, newIssue) {
            var updatedAllIssues = Session.get('allIssues');
            updatedAllIssues.push(newIssue);
            Session.set('allIssues', updatedAllIssues);

            titleInput.val('');
            bodyInput.val('');
            costInput.val('');
            priorityInput.val('');
            assigneeSelect.prop('selectedIndex', 0);
            milestoneSelect.prop('selectedIndex', 0);
         });
   }
});
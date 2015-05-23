Router.configure({
   layoutTemplate: 'layout'
});

Router.route('/', function () {
   this.render('home');
});

Router.route('/repositories', function () {
   this.render('home');
});

Router.route('/repositories/:username/:reponame', function () {
   this.render('Repository', {data: this.params});
});

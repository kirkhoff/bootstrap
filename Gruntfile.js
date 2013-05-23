var markdown = require('node-markdown').Markdown;

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy'); 
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-karma');

  // Project configuration.
  grunt.util.linefeed = '\n';

  grunt.initConfig({
    ngversion: '1.0.5',
    bsversion: '2.3.1',
    modules: [],//to be filled in by build task
    pkg: grunt.file.readJSON('package.json'),
    dist: 'dist',
    filename: 'ui-bootstrap',
    filenamecustom: '<%= filename %>-custom',
    meta: {
      modules: 'angular.module("ui.bootstrap", [<%= srcModules %>]);',
      tplmodules: 'angular.module("ui.bootstrap.tpls", [<%= tplModules %>]);',
      all: 'angular.module("ui.bootstrap", ["ui.bootstrap.tpls", <%= srcModules %>]);'
    },
    delta: {
      html: {
        files: ['template/**/*.html'],
        tasks: ['html2js', 'karma:watch:run']
      },
      js: {
        files: ['src/**/*.js'],
        //we don't need to jshint here, it slows down everything else
        tasks: ['karma:watch:run']
      }
    },
    concat: {
      dist: {
        options: {
          banner: '<%= meta.modules %>\n'
        },
        src: [], //src filled in by build task
        dest: '<%= dist %>/<%= filename %>-<%= pkg.version %>.js'
      },
      dist_tpls: {
        options: {
          banner: '<%= meta.all %>\n<%= meta.tplmodules %>\n'
        },
        src: [], //src filled in by build task
        dest: '<%= dist %>/<%= filename %>-tpls-<%= pkg.version %>.js'
      }
    },
    copy: {
      demohtml: {
        options: {
          //process html files with gruntfile config
          processContent: grunt.template.process
        },
        files: [{
          expand: true,
          src: ["**/*.html"],
          cwd: "misc/demo/",
          dest: "dist/"
        }]
      },
      demoassets: {
        files: [{
          expand: true,
          //Don't re-copy html files, we process those
          src: ["**/**/*", "!**/*.html"],
          cwd: "misc/demo",
          dest: "dist/"
        }]
      }
    },
    uglify: {
      dist:{
        src:['<%= dist %>/<%= filename %>-<%= pkg.version %>.js'],
        dest:'<%= dist %>/<%= filename %>-<%= pkg.version %>.min.js'
      },
      dist_tpls:{
        src:['<%= dist %>/<%= filename %>-tpls-<%= pkg.version %>.js'],
        dest:'<%= dist %>/<%= filename %>-tpls-<%= pkg.version %>.min.js'
      },
      dist_ieshiv: {
        src: ['<%= dist %>/ieshiv-<%= pkg.version %>.js'],
        dest: '<%= dist %>/ieshiv-<%= pkg.version %>.min.js'
      }
    },
    ieshiv: {
      src: 'misc/ieshiv.tpl.js',
      dest: '<%= dist %>/ieshiv-<%= pkg.version %>.js'
    },
    html2js: {
      dist: {
        options: {
          module: null, // no bundle module for all the html2js templates
          base: '.'
        },
        files: [{
          expand: true,
          src: ['template/**/*.html'],
          ext: '.html.js'
        }]
      }
    },
    jshint: {
      files: ['Gruntfile.js','src/**/*.js'],
      options: {
        curly: true,
        immed: true,
        newcap: true,
        noarg: true,
        sub: true,
        boss: true,
        eqnull: true,
        globals: {
          angular: true
        }
      }
    },
    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      watch: {
        background: true
      },
      continuous: {
        singleRun: true
      },
      travis: {
        singleRun: true,
        browsers: ['Firefox']
      }
    }
  });

  //register before and after test tasks so we've don't have to change cli 
  //options on the goole's CI server
  grunt.registerTask('before-test', ['jshint', 'html2js']);
  grunt.registerTask('after-test', ['build', 'copy']);

  //Rename our watch task to 'delta', then make actual 'watch'
  //task build things, then start test server
  grunt.renameTask('watch', 'delta');
  grunt.registerTask('watch', ['before-test', 'after-test', 'karma:watch', 'delta']);

  // Default task.
  grunt.registerTask('default', ['before-test', 'test', 'after-test']);

  //Common ui.bootstrap module containing all modules for src and templates
  //findModule: Adds a given module to config
  var foundModules = {};
  function findModule(name) {
    if (foundModules[name]) { return; }
    foundModules[name] = true;

    function breakup(text, separator) {
      return text.replace(/[A-Z]/g, function (match) {
        return separator + match;
      });
    }
    function ucwords(text) {
      return text.replace(/^([a-z])|\s+([a-z])/g, function ($1) {
        return $1.toUpperCase();
      });
    }
    function enquote(str) {
      return '"' + str + '"';
    }

    var module = {
      name: name,
      moduleName: enquote('ui.bootstrap.' + name),
      displayName: ucwords(breakup(name, ' ')),
      srcFiles: grunt.file.expand("src/"+name+"/*.js"),
      tplFiles: grunt.file.expand("template/"+name+"/*.html"),
      tpljsFiles: grunt.file.expand("template/"+name+"/*.html.js"),
      tplModules: grunt.file.expand("template/"+name+"/*.html").map(enquote),
      dependencies: dependenciesForModule(name),
      docs: {
        md: grunt.file.expand("src/"+name+"/docs/*.md")
          .map(grunt.file.read).map(markdown).join("\n"),
        js: grunt.file.expand("src/"+name+"/docs/*.js")
          .map(grunt.file.read).join("\n"),
        html: grunt.file.expand("src/"+name+"/docs/*.html")
          .map(grunt.file.read).join("\n")
      }
    };
    module.dependencies.forEach(findModule);
    grunt.config('modules', grunt.config('modules').concat(module));
  }

  function dependenciesForModule(name) {
    var deps = [];
    grunt.file.expand('src/' + name + '/*.js')
    .map(grunt.file.read)
    .forEach(function(contents) {
      //Strategy: find where module is declared,
      //and from there get everything inside the [] and split them by comma
      var moduleDeclIndex = contents.indexOf('angular.module(');
      var depArrayStart = contents.indexOf('[', moduleDeclIndex);
      var depArrayEnd = contents.indexOf(']', depArrayStart);
      var dependencies = contents.substring(depArrayStart + 1, depArrayEnd);
      dependencies.split(',').forEach(function(dep) {
        if (dep.indexOf('ui.bootstrap.') > -1) {
          var depName = dep.trim().replace('ui.bootstrap.','').replace(/['"]/g,'');
          if (deps.indexOf(depName) < 0) {
            deps.push(depName);
            //Get dependencies for this new dependency
            deps = deps.concat(dependenciesForModule(depName));
          }
        }
      });
    });
    return deps;
  }

  grunt.registerTask('dist', 'Override dist directory', function() {
    var dir = this.args[0];
    if (dir) { grunt.config('dist', dir); }
  });

  grunt.registerTask('build', 'Create bootstrap build files', function() {
    //If arguments define what modules to build, build those. Else, everything
    if (this.args.length) {
      this.args.forEach(findModule);
      grunt.config('filename', grunt.config('filenamecustom'));
    } else {
      grunt.file.expand({
        filter: 'isDirectory', cwd: '.'
      }, 'src/*').forEach(function(dir) {
        findModule(dir.split('/')[1]);
      });
    }
    
    //Pluck will take an array of objects, and map the given key to a new array
    //@example: expect( pluck([{a:1},{a:2}], 'a') ).toBe([1,2])
    function pluck(array, key) {
      return array.map(function(obj) {
        return obj[key];
      });
    }

    var modules = grunt.config('modules');
    grunt.config('srcModules', pluck(modules, 'moduleName'));
    grunt.config('tplModules', pluck(modules, 'tplModules').filter(function(tpls) { return tpls.length > 0;} ));
    grunt.config('demoModules', modules.filter(function(module) {
      return module.docs.md && module.docs.js && module.docs.html;
    }));

    var srcFiles = pluck(modules, 'srcFiles');
    var tpljsFiles = pluck(modules, 'tpljsFiles');
    //Set the concat task to concatenate the given src modules
    grunt.config('concat.dist.src', grunt.config('concat.dist.src')
                 .concat(srcFiles));
    //Set the concat-with-templates task to concat the given src & tpl modules
    grunt.config('concat.dist_tpls.src', grunt.config('concat.dist_tpls.src')
                 .concat(srcFiles).concat(tpljsFiles));

    grunt.task.run(['concat', 'ieshiv', 'uglify']);
  });
  
  grunt.registerTask('ieshiv', 'Create the ieshiv file, based on the current build', function() {
    var directiveNames = [];
    var directiveDeclarations = grunt.file.read(grunt.config('concat.dist.dest')).match(/\.directive\([^'"]*('|")[^'"]*('|")/g);
    
    directiveDeclarations.forEach(function(match) {
      directiveNames.push(/('|")([^'"]+)('|")/.exec(match)[2]);
    });
    
    grunt.file.write(
      grunt.config('ieshiv.dest'),
      grunt.template.process(grunt.file.read(grunt.config('ieshiv.src')), {data: {
        directives: '"' + directiveNames.join('", "') + '"',
        version : grunt.config('pkg.version')
      }})
    );
    
    grunt.log.writeln('File "' + grunt.config('ieshiv.dest') + '" created.');
  });

  grunt.registerTask('test', 'Run tests on singleRun karma server', function() {
    grunt.task.run(process.env.TRAVIS ? 'karma:travis' : 'karma:continuous');
  });

  //changelog generation
  grunt.registerTask('changelog', 'generates changelog markdown from git commits', function () {

    var changeFrom = this.args[0], changeTo = this.args[1] || 'HEAD';

    var done = grunt.task.current.async();
    var child = grunt.util.spawn({
      cmd:process.platform === 'win32' ? 'git.cmd' : 'git',
      args: [
        'log',
        changeFrom + '..' + changeTo,
        '--format=%H%n%s%n%b%n==END=='
      ]
    }, function (err, result, code) {

      var changelog = {};
      function addChange(changeType, component, change) {
        if (!changelog[changeType]) {
          changelog[changeType] = {};
        }
        if (!changelog[changeType][component]) {
          changelog[changeType][component] = [];
        }
        changelog[changeType][component].push(change);
      }

      var COMMIT_MSG_REGEXP = /^(chore|demo|docs|feat|fix|refactor|style|test)\((.+)\):? (.+)$/;
      var gitlog = result.toString().split('\n==END==\n').reverse();

      if (code) {
        grunt.log.error(err);
        done(false);
      } else {

        gitlog.forEach(function (logItem) {
          var lines = logItem.split('\n');
          var sha1 = lines.shift().substr(0,8); //Only first 7 of sha1
          var subject = lines.shift();

          var msgMatches = subject.match(COMMIT_MSG_REGEXP);
          var changeType = msgMatches[1];
          var component = msgMatches[2];
          var componentMsg = msgMatches[3];

          var breaking = logItem.match(/BREAKING CHANGE:([\s\S]*)/);
          if (breaking) {
            addChange('breaking', component, {
              sha1: sha1,
              msg: breaking[1]
            });
          }
          addChange(changeType, component, {sha1:sha1, msg:componentMsg});
        });

        console.log(grunt.template.process(grunt.file.read('misc/changelog.tpl.md'), {data: {
          changelog: changelog,
          today: grunt.template.today('yyyy-mm-dd'),
          version : grunt.config('pkg.version')
        }}));

        done();
      }
    });
  });

  return grunt;
};

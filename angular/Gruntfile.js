var pkg = require('./package.json');

module.exports = function(grunt){
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
    grunt.util.linefeed = '\n';
    grunt.initConfig({
        pkg: pkg,
        dist: 'dist',
        filename: pkg.name,
        meta: {
            banner: ['/*',
                     ' * <%= pkg.name %>',
                     ' * Version: <%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>',
                     ' */\n'].join('\n')
        },
        htmlhint: {
            build: {
                options: {
                    'tag-pair': true,
                    'tagname-lowercase': true,
                    'attr-lowercase': true,
                    'attr-value-double-quotes': true,
                    'doctype-first': false,
                    'spec-char-escape': true,
                    'id-unique': true,
                    'head-script-disabled': true,
                    'style-disabled': true
                },
                src: ['src/js/**/*.html']
            }
        },
        jshint: {
            files: ['Gruntfile.js','src/js/**/*.js','!src/js/partials/*.js'],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        html2js: {
            'app-container-common': {
                src: ['src/js/**/*.html'],
                dest: 'src/js/partials/templates.html.js'
            }
        },
        concat: {
            dist: {
                options: {
                    banner: '<%= meta.banner %>\n',
                    srcMap: true
                },
                src: [], // list generated in build.
                dest: '<%= dist %>/<%= filename %>.js'
            }
        },
        uglify: {
            options: {
                banner: '<%= meta.banner %>'
            },
            dist:{
                src:['<%= concat.dist.dest %>'],
                dest:'<%= dist %>/<%= filename %>.min.js'
            }
        },
        delta: {
            html: {
                files: ['src/js/**/*.html'],
                tasks: ['html2js', 'after-test']
            },
            js: {
                files: ['src/js/**/*.js'],
                tasks: ['jshint','after-test']
            }
        }
    });

    grunt.registerTask('before-test',['htmlhint','jshint','html2js']);
    grunt.registerTask('after-test',['build']);
    grunt.renameTask('watch','delta');
    grunt.registerTask('watch',['before-test', 'after-test', 'delta']);
    grunt.registerTask('default', ['before-test', /*'test',*/ 'after-test']);

    grunt.registerTask('build',function() {
        var jsSrc = [];
        // there is no semblance of order here so need to be careful about
        // dependencies between .js files
        grunt.file.expand({filter: 'isFile', cwd: '.'}, 'src/js/**')
             .forEach(function(f){
                if(f.search(/\.js$/) > 0 && f.search(/\.spec\.js$/) === -1) {
                    jsSrc.push(f);
                }
             });
        grunt.config('concat.dist.src', grunt.config('concat.dist.src').concat(jsSrc));
        grunt.task.run(['concat:dist','uglify']);
    });
};

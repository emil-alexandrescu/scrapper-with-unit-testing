module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        shell: {
            options: {
                stout: true
            },
            npm_install: {
                command: 'npm install'
            },
            bower_install: {
                command: 'bower install'
            }
        },

        mochaTest: {
            test: {
                options: {
                    reporter: 'nyan',
                    timeout: 5000,
                    mocha: require('mocha')
                },
                src: ['test/*.js']
            },
            report: {
                options: {
                    reporter: 'spec',
                    mocha: require('mocha')
                },
                src: ['test/*.js']
            }
        }
    });

    grunt.registerTask('default', ['mochaTest:test']);
    grunt.registerTask('test', ['mochaTest:test']);
    grunt.registerTask('test_report', ['mochaTest:report']);
    grunt.registerTask('install', ['shell:npm_install', 'shell:bower_install']);
};
//var m = require('muon');
var Q = require("q");
//var dbg = true;
var cfg = {path: '/Users/andrejfilin/some'};
var fs = require('fs');
var dir = cfg.path + '/migrations/';
var g = require("grunt");

process.exit = function() {};


describe('migration module test: case 3 (add a model and an attribute)', function() {
    var test_models_source_path = cfg.path + '/test/model_sets/set3/models_s/';
    var test_models_changed_path = cfg.path + '/test/model_sets/set3/models_ch/';
    before(function(done) {
        if (!g.file.exists(dir))
            g.file.mkdir(dir);
        if (g.file.exists(cfg.path + '/migrations/history.db'))
            fs.unlink(cfg.path + '/migrations/history.db', function(err) {
                if (err) console.log('unlinking error 1 ' + err)
            });
        if(g.file.exists(cfg.path + '/undefined.db'))
            fs.unlink(cfg.path + '/undefined.db', function(err) {
                if (err) console.log('unlinking error 2 ' + err)
            });
        fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
            if (err) {console.log('readdir error ' + err)}
            for (var i in models) {
                fs.unlink(cfg.path + '/server/app/models/' + models[i], function(err) {if (err) console.log('unlinking error 3 ' +err)});
            }
        });
        fs.readdir(test_models_source_path, function(err, models) {
            if (err) {console.log(err)}
            for (var i in models) {
                fs.writeFileSync(cfg.path + '/server/app/models/' + models[i], fs.readFileSync(test_models_source_path + models[i]));
            }

            setTimeout(function() {
                console.log('bablabla');
                done();
            }, 10);
        });
    });

    before(function(done) {
        global.__mcfg__ = { serverMode: 'development' };
        muon = require('muon');
//        muon.once('migrate-ready', function() {
        muon.ready(function() {
            console.log('muon ready in case 3');
//            done();
            global.__mcfg__ = { serverMode: 'migration' };
            muon.reload(__mcfg__, function() {
                console.log('reloaded in case 3');

                fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
                    if (err) {console.log('readdir error ' + err)}
                    for (var i in models) {
                        fs.unlink(cfg.path + '/server/app/models/' + models[i], function(err) {
                            if (err) console.log('unlinking error 3 ' + err)
                            fs.readdir(test_models_changed_path, function(err, models) {
                                if (err) {console.log(err)}
                                for (var i in models) {
                                    console.log(i);
                                    fs.writeFileSync(cfg.path + '/server/app/models/' + models[i], fs.readFileSync(test_models_changed_path + models[i]));
                                }
                                done();
//                                setTimeout(function() {done()},100);
                            });
//                            done();
                        });
                    }
                });
//                done();
            });
        });
    });

//    before(function(done) {
//        global.__mcfg__ = { serverMode: 'migration' };
//        muon.reload(__mcfg__, function() {
//            done();
//        });
//    });
//
//    before(function() {
//        fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
//            if (err) {console.log('readdir error ' + err)}
//            for (var i in models) {
//                fs.unlink(cfg.path + '/server/app/models/' + models[i], function(err) {
//                    if (err) console.log('unlinking error 3 ' + err)
//                    else done();
//                });
//            }
//        });
//    });

    it('should detect new model and attribute', function(done) {
        console.log('test start');
        global.__mcfg__ = { serverMode: 'development' };
        muon.reload(__mcfg__,function() {
            muon.ready(function() {
                done()
            });
//            done();
        })
    });



    it('should add new model and attribute to the database', function(done) {
        global.__mcfg__ = { serverMode: 'migration' };
        muon.reload(__mcfg__, function() {
            muon.ready(function() {
                done()
            });
        });
    });

    it('should detect nothing', function(done) {
        global.__mcfg__ = { serverMode: 'development' };
        muon.reload(__mcfg__,function() {
            muon.ready(function() {
                done()
            });
        })

    });
});
var fs = require( 'fs' ),
    path = require( 'path' ),
    rimraf = require( 'rimraf' ),
    mkdirp = require( 'mkdirp' );

const PATH = process.argv[ 2 ];

if ( !PATH ) {
    return console.error( 'Path is missing' );
}

function log( str ) {
    console.log( ( new Date() ).toLocaleString(), str );
}

var gitRevParse = require( './git-rev-parse' );

Promise.all( [ gitRevParse( '.' ), gitRevParse( PATH ) ] ).then( ( [ hash1, hash2 ] ) => {

    if ( hash1 != hash2 ) {
        return console.error( 'Commit is not the same !' );
    }

    var copy = file => {
        var rs = fs.createReadStream( file ),
            ws = fs.createWriteStream( path.join( PATH, file ) );

        rs.pipe( ws );

        ws.on( 'finish', function () {
            log( `Copy: ${file}` );
        } );

        ws.on( 'error', console.error );
    };

    var del = file => {
        file = path.join( PATH, file );
        rimraf( file, e => {
            if ( e ) {
                console.error( e );
            } else {
                log( `Remove: ${file}` );
            }
        } );
    };

    var addDir = dir => {
        dir = path.join( PATH, dir );
        mkdirp( dir, function ( err ) {
            if ( err ) {
                console.error( err );
            } else {
                log( `Dir: ${dir}` );
            }
        } );
    };

    var actions = {
        'add': copy,
        'change': copy,
        'addDir': addDir,
        'unlink': del,
        'unlinkDir': del,
    };

    var chokidar = require( 'chokidar' );

    chokidar.watch( '.', {

        ignored: /.git(\/|\\)/,
        ignoreInitial: true,

    } ).on( 'all', ( event, file ) => {

        if ( !actions[ event ] ) {
            return console.error( `No this action: ${action}` );
        }

        actions[ event ]( file );

        } ).on( 'error', console.error );

}, console.error );

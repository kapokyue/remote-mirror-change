var exec = require( 'child_process' ).exec;

var cmd = 'git rev-parse --verify HEAD';

module.exports = function ( cwd ) {
    return new Promise( ( res, rej ) => {
        exec( cmd, { cwd }, function ( err, stdout ) {
            if ( err ) rej( err );
            else res( stdout.trim() );
        } );
    } );
};
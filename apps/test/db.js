		
/* **************************************************************** 
 *
 *  Description : Just a test app
 *  License :     All the sources are available under the GPL v3
 *                http://www.gnu.org/licenses/gpl.html
 *  Author : Christophe Meurice
 *  
 *  (C) Meurice Christophe 2012
 *
 ****************************************************************** */

var log = require('../../lib/log');

exports.init = function(){
    log.write("test","init","Init test database");
};
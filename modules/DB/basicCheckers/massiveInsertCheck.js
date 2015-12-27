// -- NODE MODULES {
var vlog	= require('vlog');
// -- }

module.exports = function massiveInsertCheck(err, myDocuments) {
    if (err) {
        return vlog.vlog("[VLOG][ERROR]",err);
    }
    else {
        vlog.vlog('<'+myDocuments.insertedCount+'> elements successfully inserted');
    }
};
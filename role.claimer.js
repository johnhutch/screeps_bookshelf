module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        // if in target room
        if (creep.room.name != creep.memory.target) {
            //console.log("claimer in: " + creep.room.name + ". Heading towards " + creep.memory.target + ". At: " + creep.pos.x + ", " + creep.pos.y);
            // find exit to target room
            var exit = creep.room.findExitTo(creep.memory.target);
            // move to exit
            creep.moveTo(creep.pos.findClosestByRange(exit));
        }
        else {
            // try to claim controller
            let err = creep.claimController(creep.room.controller);
            if (err == ERR_GCL_NOT_ENOUGH) {
                //console.log("GCL not high enough. Reserving."); 
                err = creep.reserveController(creep.room.controller);
            }
            if (err == ERR_NOT_IN_RANGE) {
                //console.log("movingn towards controller...");
                // move towards the controller
                creep.moveTo(creep.room.controller);
            } 
        }
    }
};

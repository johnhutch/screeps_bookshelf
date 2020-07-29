var roleMiner = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if (!creep.memory.sourceId) {
            // couldn't find a source. Go find one. 
            let err = "Miner has no no sourceId in memory.";
            let mySpawn = creep.room.find(FIND_MY_SPAWNS);
            if (mySpawn.length > 0) {
                sourceId = mySpawn[0].findContaineredSourceId();
                if (sourceId) {
                    creep.memory.sourceId = sourceId;
                    err = err + " Assigned him " + sourceId;
                } else {
                    err = err + " Couldin't find one to assign him. Waiting...";
                }
                //console.log(err);
            } 
        } else {
            let source = Game.getObjectById(creep.memory.sourceId);
            // find container next to source
            let container = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: s => s.structureType == STRUCTURE_CONTAINER
            })[0];
            
            if (container) { 
                // if creep is on top of the container
                if (creep.pos.isEqualTo(container.pos)) {
                    // harvest source
                    creep.harvest(source);
                }
                // if creep is not on top of the container
                else {
                    // move towards it
                    creep.moveTo(container);
                }
            }
        }
    }
};

module.exports = roleMiner;

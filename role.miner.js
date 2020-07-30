var roleMiner = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if (!creep.memory.sourceId) {
            // couldn't find a source. Go find one. 
            let mySpawn = creep.room.find(FIND_MY_SPAWNS);
            let sourceId = null;
            if (mySpawn.length > 0) {
                sourceId = mySpawn[0].findContaineredSourceId();
                if (sourceId == null) {
                    // just go drop-mine a source
                    source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                    sourceId = source.id;
                }
                creep.memory.sourceId = sourceId;
            } 
        } else {
            let source = Game.getObjectById(creep.memory.sourceId);
            let container = false;
            // find container next to source
            if (source != null) {
                let container = source.pos.findInRange(FIND_STRUCTURES, 1, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER
                })[0];
            }
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
            } else {
                if (creep.harvest(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    // move towards it
                    creep.moveTo(source);
                }
            }
        }
    }
};

module.exports = roleMiner;

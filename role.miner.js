var roleMiner = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if (!creep.memory.sourceId) {
            console.log("no sourceId");
        } else {

            let source = Game.getObjectById(creep.memory.sourceId);
            // find container next to source
            let container = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: s => s.structureType == STRUCTURE_CONTAINER
            })[0];
            
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
};

module.exports = roleMiner;
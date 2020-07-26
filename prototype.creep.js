var roles = {
    harvester: require('role.harvester'),
    upgrader: require('role.upgrader'),
    builder: require('role.builder'),
    hauler: require('role.hauler'),
    miner: require('role.miner'),
    fixer: require('role.fixer'),
    wallRepairer: require('role.wallRepairer'),
    rampartRepairer: require('role.rampartRepairer')
};

Creep.prototype.runRole =
    function () {
        roles[this.memory.role].run(this);
    };

Creep.prototype.buildRoad =
    function () {
        // if this space doesn't have a road
        if (this.pos.lookFor(LOOK_STRUCTURES, { filter: s => (s.structureType == STRUCTURE_ROAD) } ) == false ) {
            memval = "road_" + this.pos.x + "_" + this.pos.y;

            // in case this is a brand new room, initialize memory.roads
            if (this.room.memory.roads == undefined) {
                this.room.memory.roads = {};
            }

            // if this is a space UPON WHICH WE HATH NEVER TROD
            if (this.room.memory.roads[memval] == undefined) {
                this.room.memory.roads[memval] = 1;
            } else {
                this.room.memory.roads[memval]++;

                // if many creeps HATH TROD here... build a muthfuckin road
                if (this.room.memory.roads[memval] >= 10) {
                    //console.log("building a road! at: " + memval);
                    this.room.createConstructionSite(this.pos.x, this.pos.y, STRUCTURE_ROAD);
                    // and delete the memory record cause we don't need that shit anymore
                    delete this.room.memory.roads[memval];
                }
            }
        } 
    };

/** @function 
    @param {bool} useContainer
    @param {bool} useSource */
Creep.prototype.getEnergy =
    function (useContainer, useSource) {
        /** @type {StructureContainer} */
        let container;
        // if the Creep should look for containers
        if (useContainer) {
            // find closest container
            container = this.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: s => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE) &&
                             s.store[RESOURCE_ENERGY] > 0
            });
            // if one was found
            if (container != undefined) {
                // try to withdraw energy, if the container is not in range
                if (this.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    // move towards it
                    this.moveTo(container);
                }
            }
        }
        // if no container was found and the Creep should look for Sources
        if (container == undefined && useSource) {
            // find closest source
            var source = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

            // try to harvest energy, if the source is not in range
            if (this.harvest(source) == ERR_NOT_IN_RANGE) {
                // move towards it
                this.moveTo(source);
            }
        }
    };

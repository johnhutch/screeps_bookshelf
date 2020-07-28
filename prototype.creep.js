var roles = {
    harvester: require('role.harvester'),
    upgrader: require('role.upgrader'),
    builder: require('role.builder'),
    hauler: require('role.hauler'),
    miner: require('role.miner'),
    fixer: require('role.fixer'),
    wallRepairer: require('role.wallRepairer'),
    rampartRepairer: require('role.rampartRepairer'),
    claimer: require('role.claimer'),
    longDistanceHarvester: require('role.longDistanceHarvester')
};

Creep.prototype.runRole =
    function () {
        roles[this.memory.role].run(this);
    };

Creep.prototype.rdMemval = 
    function () {
        let memval = "rd_" + this.pos.x + "_" + this.pos.y;
        return memval;
    };

Creep.prototype.buildRoad =
    function () {
        // if this space doesn't have a road
        if (this.pos.lookFor(LOOK_STRUCTURES, { filter: s => (s.structureType != STRUCTURE_ROAD) } ) == false ) {
            memval = Creep.rdMemval;

            // in case this is a brand new room, initialize memory.cowpaths
            if (this.room.memory.cowpaths == undefined) {
                this.room.memory.cowpaths = {};
            }

            // if this is a space UPON WHICH WE HATH NEVER TROD
            if (this.room.memory.cowpaths[memval] == undefined) {
                this.room.memory.cowpaths[memval] = 1;
            } else {
                this.room.memory.cowpaths[memval]++;

                // if many creeps HATH TROD here... build a muthfuckin road
                if (this.room.memory.cowpaths[memval] >= 10) {
                    //console.log("building a road! at: " + memval);
                    this.room.createConstructionSite(this.pos.x, this.pos.y, STRUCTURE_ROAD);
                    // and delete the memory record cause we don't need that shit anymore
                    delete this.room.memory.cowpaths[memval];
                }
            }
        } 
        // if this space already has a road
        if (this.pos.lookFor(LOOK_STRUCTURES, { filter: s => (s.structureType == STRUCTURE_ROAD) } ) == false) {
            // in case this is a brand new room, initialize memory.roads
            if (this.room.memory.roads == undefined) {
                this.room.memory.roads = {};
            }

            // if this is a space UPON WHICH WE HATH NEVER TROD
            if (this.room.memory.roads[memval] == undefined) {
                this.room.memory.roads[memval] = true;
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

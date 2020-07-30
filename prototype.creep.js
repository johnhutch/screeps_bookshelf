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

Creep.findContainerResourceType = 
    function (container) {
        // assume it's a regular energy source
        let resourceType = RESOURCE_ENERGY;

        // find minerals in range of the container
        // TODO: is there a scenario where you can have a container 1 space away from
          // a source AND a mineral?
        let nearbyMinerals = source.pos.findInRange(FIND_MINERALS, 1);
        if (nearbyMinerals.length > 0) {
            resourceType = nearbyMinerals[0].mineralType;
        }
        return resourceType;
    };

Creep.prototype.transferEverything =
    function (structure) { 
        let result = undefined;
        result = this.transfer(structure, RESOURCE_ENERGY);
        if (result == ERR_NOT_IN_RANGE) {
            return result;
        } else {
            // try other materials
            return result;
        }
    };

Creep.prototype.buildRoad =
    function () {
        if (!this.room.memory.buildRoads) {
            return false;
        }
        // in case this is a brand new room, initialize memory.cowpaths
        if (this.room.memory.cowpaths == undefined) {
            this.room.memory.cowpaths = {};
        }
        if (this.room.memory.roads == undefined) {
            this.room.memory.roads = {};
        }

        // in case this is a brand new room, initialize memory.roads
        memval = this.rdMemval();

        // check to see if this space as a road
        let myStructs = this.pos.lookFor(LOOK_STRUCTURES, { filter: s => (s.structureType = STRUCTURE_ROAD) } ); 

        // if this space already has a road
        if (myStructs.length > 0) {
            // if this is a space UPON WHICH WE HATH NEVER TROD
            if (this.room.memory.roads[memval] == undefined) {
                this.room.memory.roads[memval] = true;
            }
        } else {
            // if this is a space UPON WHICH WE HATH NEVER TROD
            err = "cowpath " + memval;
            if (this.room.memory.cowpaths[memval] == undefined) {
                this.room.memory.cowpaths[memval] = 1;
                err = err + " is brand new to me so I'm setting it at a 1."
            } else {
                err = err + " has been seen so I changed its " + this.room.memory.cowpaths[memval];
                this.room.memory.cowpaths[memval]++;
                err = err + " to a " + this.room.memory.cowpaths[memval];

                // if many creeps HATH TROD here... build a muthfuckin road
                if (this.room.memory.cowpaths[memval] >= 10) {
                    err = + " and now its over 10!";
                    //console.log("building a road! at: " + memval);
                    this.room.createConstructionSite(this.pos.x, this.pos.y, STRUCTURE_ROAD);
                    // and delete the memory record cause we don't need that shit anymore
                    delete this.room.memory.cowpaths[memval];
                }
            }
            //console.log(err);
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
                filter: s => (s.structureType == STRUCTURE_CONTAINER 
                           || s.structureType == STRUCTURE_STORAGE 
                           || s.structureType == STRUCTURE_TERMINAL)
                           && s.store[RESOURCE_ENERGY] > 0
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

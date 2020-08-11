var roles = {
    harvester: require('role.harvester'),
    upgrader: require('role.upgrader'),
    builder: require('role.builder'),
    hauler: require('role.hauler'),
    filler: require('role.filler'),
    miner: require('role.miner'),
    attacker: require('role.attacker'),
    defenseRepairer: require('role.defenseRepairer'),
    roadRepairer: require('role.roadRepairer'),
    structureRepairer: require('role.structureRepairer'),
    claimer: require('role.claimer'),
    longDistanceSalvager: require('role.longDistanceSalvager'),
    longDistanceHarvester: require('role.longDistanceHarvester'),
    longDistanceBuilder: require('role.longDistanceBuilder'),
    longDistanceUpgrader: require('role.longDistanceUpgrader')
};

Creep.prototype.runRole =
    function () {
        try {
            roles[this.memory.role].run(this);
        } catch(error) {
            console.log("runRole doesn't know about " + this);
        }
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

Creep.prototype.unload = 
    function (room = false) {
        let structure = undefined;
        room = Game.rooms[room] || this.room;
        // if we don't have any energy to deposit, just minerals, head to storage
        if (this.store[RESOURCE_ENERGY] == 0) {
            structure = room.storage;
        } else {
            // we've got energy to deposit, so
            // find closest spawn, extension or tower which is not full
            // if the spawn and extensions need energy badly, or we're a filler, avoid towers and links
            if (this.memory.role == "filler" || room.energyAvailable < 550) {
                structure = this.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_SPAWN
                                || s.structureType == STRUCTURE_EXTENSION
                                || s.structureType == STRUCTURE_TOWER)
                                && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                });
            } else { 
                structure = this.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_SPAWN
                                || s.structureType == STRUCTURE_EXTENSION
                                || s.structureType == STRUCTURE_LINK
                                || s.structureType == STRUCTURE_TOWER)
                                && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                });
            }

            // if everything's full
            if (structure == undefined) {
                // look for a link to fill
                let link = this.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_LINK
                                && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                });
                let controllerContainer = Game.getObjectById(room.memory.controllerContainerId);
                if (link != undefined && this.memory.role != "filler") {
                    structure = link;
                } else if (room.terminal) {
                    // if not, look for a terminal to dump it
                    structure = room.terminal;
                } else if (controllerContainer) {
                    structure = Game.getObjectById(room.memory.controllerContainerId);
                } else  {
                    // otherwise, throw it in storage
                    structure = room.storage;
                }
            }
        }

        // if we found one
        if (structure != undefined) {
            // try to transfer energy, if it is not in range
            if (this.transfer(structure, _.findKey(this.store)) == ERR_NOT_IN_RANGE) {
                // move towards it
                this.moveTo(structure, {visualizePathStyle: {stroke: '#000000'}});
            }
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
        let myStructs = this.pos.lookFor(LOOK_STRUCTURES, { filter: s => (s.structureType == STRUCTURE_ROAD) } ); 

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

Creep.prototype.getSalvage =
    function () {
        let salvage = this.pos.findClosestByPath(this.room.salvageSources());

        // if no container was found and the Creep should look for Sources
        if (salvage != undefined) {
            if (this.withdraw(salvage, _.findKey(salvage.store)) == ERR_NOT_IN_RANGE) {
                // move towards it
                this.moveTo(salvage, {visualizePathStyle: {stroke: '#ff0000'}});
            }
        } else {
            // no salvage, so just become a remote harvester
            this.getEnergy(true, true);
        }
    };

/** @function */
// finds energy and resources to be hauled back to primary storage and extensions
Creep.prototype.haulResources =
    function () {
        // if the spawn was assigned a target 
        if (this.memory.targetId != undefined) {
            let target = Game.getObjectById(this.memory.targetId);
            // and the target still exists in the room
            if (target) {
                if (target.store[RESOURCE_ENERGY] == 0 && this.room.energyAvailable < 550) {
                    target = this.getEnergy(true, true);
                }
                if (target && this.withdraw(target, _.findKey(target.store)) == ERR_NOT_IN_RANGE) {
                    // move towards it
                    this.moveTo(target, { visualizePathStyle: {stroke: '#000000'} });
                }
            } else {
                // target seems to have been deleted. go find something.
                this.findHaulableResources();
            }
        } else {
            // target was not assigned on spawn. go find something.
            this.findHaulableResources();
        }
    };

Creep.prototype.findHaulableResources =
    function () {
        // look for dropped resources from dead creeps
        let dropped_resource = this.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
        if (dropped_resource == undefined) {
            // find closest container
            container = this.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: s => (s.structureType == STRUCTURE_CONTAINER)
                          && s.store.getFreeCapacity() < s.store.getCapacity()
            });

            // if we didn't find a container with resources to be picked up
            if (container == undefined) {
                // and if we have a terminal
                if (this.room.terminal) {
                    // grab some energy from storage
                    container = this.room.terminal
                } else {
                    // otherwise, grab it from storage
                    container = this.room.storage;
                }
            }

            // if one was found
            if (container != undefined) {
                // try to withdraw energy, if the container is not in range
                if (this.withdraw(container, _.findKey(container.store)) == ERR_NOT_IN_RANGE) {
                    // move towards it
                    this.moveTo(container, {visualizePathStyle: {stroke: '#ff0000'}});
                }
            } 
        } else {
            if (this.pickup(dropped_resource) == ERR_NOT_IN_RANGE) {
                // move towards it
                this.moveTo(dropped_resource, {visualizePathStyle: {stroke: '#ff0000'}});
            }
        }
    };

/** @function 
    @param {bool} useContainer
    @param {bool} useSource */
Creep.prototype.getEnergy =
    function (useContainer, useSource) {
        /** @type {StructureContainer} */
        let target = this.memory.targetId || null;
        let source = undefined;

        if (target) {
            target = Game.getObjectById(target);
        }

        // if the Creep should look for containers
        if (!target && useContainer) {
            target = this.pos.findClosestByPath(_.filter(this.room.energySources(), (s) => s.structureType != STRUCTURE_CONTAINER ));

            if (!target) {
                if (this.room.terminal && this.room.terminal.store[RESOURCE_ENERGY] > 0) {
                    target = this.room.terminal;
                } else if (this.room.storage && this.room.storage.store[RESOURCE_ENERGY] > 0) {
                    target = this.room.storage;
                } else {
                    // find closest container
                    target = this.pos.findClosestByPath(this.room.energySources());
                }
            }
        }

        // if no container was found and the Creep should look for Sources
        if (!target && useSource) {
            // find closest source
            target = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

        }
        if (target) {
            if (this.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                // move towards it
                this.moveTo(target, {visualizePathStyle: {stroke: '#ff0000'}});
            } else if (this.pickup(target) == ERR_NOT_IN_RANGE) {
                // move towards it
                this.moveTo(target, {visualizePathStyle: {stroke: '#ff0000'}});
            } else if (this.harvest(target) == ERR_NOT_IN_RANGE) {
                // try to harvest energy, if the source is not in range
                // move towards it
                this.moveTo(target, {visualizePathStyle: {stroke: '#ff0000'}});
            }
        }
    };


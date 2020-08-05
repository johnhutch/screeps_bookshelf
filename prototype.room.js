Room.prototype.checkForContainers = 
    function () {
        let sources = this.find(FIND_SOURCES);
        for (let source of sources) {
            let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: s => s.structureType == STRUCTURE_CONTAINER
            });
            if (containers.length > 0) {
                this.memory.hasContainers = true;
                break;
            }
            this.memory.hasContainers = false;
        }
    };

Room.prototype.energySources = 
    function () {
        let dropped_resources = this.find(FIND_DROPPED_RESOURCES, {
            filter: s => (s.structureType != STRUCTURE_CONTAINER)
        });
        let ruins = this.find(FIND_RUINS, {
            filter: s => (s.store[RESOURCE_ENERGY] > 0)
        });
        let links = this.find(FIND_STRUCTURES, {
            filter: s => (s.structureType == STRUCTURE_LINK)
                      && s.store[RESOURCE_ENERGY] > 0
        });
        let terminal = this.terminal && this.terminal.store[RESOURCE_ENERGY] > 0 ? this.terminal : null;
        let storage = this.storage && this.storage.store[RESOURCE_ENERGY] > 0 ? this.storage : null;
        let containers = this.find(FIND_STRUCTURES, {
            filter: s => (s.structureType == STRUCTURE_CONTAINER)
                      && s.store[RESOURCE_ENERGY] > 0
        });
        let sources = [...links, ...ruins, ...dropped_resources] 
        return sources;
    };

Room.prototype.balanceLinks = 
    function () {
        let links = this.find(FIND_STRUCTURES, { filter: s => s.structureType == STRUCTURE_LINK });
        links = _.sortBy(links, (s) => { return s.store[RESOURCE_ENERGY] });

        /*
        for (let i = 0; i < links.length; i++) {
            let msg = i + ". " + this.name + ": ";
            msg = msg + links[i].id + " has " + links[i].store[RESOURCE_ENERGY] + " energy.";
            console.log(msg);
        }
        */
        // if we have links,
        // and least filled is empty, and the most filled is not empty
        // or the least filled is not full and the most filled is full
        // transfer half
        if ( (links.length > 0) 
          && (
               (links[0].store[RESOURCE_ENERGY] == 0 && _.last(links).store[RESOURCE_ENERGY] > _.first(links).store[RESOURCE_ENERGY])
            || (links[0].store.getFreeCapacity(RESOURCE_ENERGY) > 0 && _.last(links).store.getFreeCapacity(RESOURCE_ENERGY) == 0)
          ) ) { 

            _.last(links).transferEnergy(_.first(links), (_.last(links).store[RESOURCE_ENERGY] / 2));

            this.visual.text(
                '<- from ',
                _.first(links).pos.x,
                _.first(links).pos.y,
                {align: 'left', opacity: 0.8});
            this.visual.text(
                '-> to ',
                _.last(links).pos.x,
                _.last(links).pos.y,
                {align: 'left', opacity: 0.8});
        }
    };

// finds an unassigned target for a Hauler to haul from
Room.prototype.getHaulerTarget = 
    function (totalHaulers) {
        let haulTargetId = undefined;
        let sources = this.find(FIND_SOURCES);
        let extractors = this.find(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_EXTRACTOR });
        sources = [...sources, ...extractors];
        let creepsInRoom = this.find(FIND_MY_CREEPS);
        let attachedSource = undefined;

        for (let source of sources) {
            // if this is an extractor, change the focus for the rest of the fn 
            // to the mineral source its sitting on top of
            if (source.structureType && source.structureType == STRUCTURE_EXTRACTOR) {
                source = source.pos.lookFor(LOOK_MINERALS)[0];
                totalHaulers = 1;
            }

            // if the source has a miner
            if (_.some(creepsInRoom, c => c.memory.role == 'miner' && c.memory.sourceId == source.id)) {
                // check whether or not the source has a container
                let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER
                });
                // if there is a container next to the source, change our focus to THAT
                if (containers.length > 0) {
                    attachedSource = source;
                    source = containers[0];
                } else {
                    this.createAttachedContainer(source);
                }
                // get the number of haulers assigned to that source
                let numHaulers = _.filter(creepsInRoom, c => c.memory.role == 'hauler' && c.memory.targetId == source.id);

                // if that number is less than 2, we need to assign another hauler to it.
                if (numHaulers.length < totalHaulers) {
                    haulTargetId = source.id;
                    break;
                }
            }
        }

        return haulTargetId;
    };

Room.prototype.createAttachedContainer = 
    function (source) {
        // TODO: create a construction site for a source that currently does not have one
        console.log(this.name + "found a source without an attached container. i would build one if I knew how.");
    };

// all the sources of misc, non-energy salvage in the room
Room.prototype.salvageSources = 
    function () {
        let dropped_resources = this.find(FIND_DROPPED_RESOURCES);
        let tombstones = this.find(FIND_TOMBSTONES, {
            filter: s => (s.store.getUsedCapacity() > 0)
        });
        let ruins = this.find(FIND_RUINS, {
            filter: s => (s.store.getUsedCapacity() > 0)
        });
        let containers = this.find(FIND_STRUCTURES, {
            filter: s => (s.structureType == STRUCTURE_CONTAINER)
                      && (s.store.getUsedCapacity() > 0)
        });
        let sources = [...ruins, ...dropped_resources, ...tombstones, ...containers]
        return sources;
    };

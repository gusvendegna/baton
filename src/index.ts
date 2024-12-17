import Docker from 'dockerode';

// Docker client setup
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Node labels
const PRIMARY_LABEL = 'primary';
const SECONDARY_LABEL = 'secondary';

async function getNodes() {
    const nodes = await docker.listNodes();
    return nodes.map((node: any) => ({
        id: node.ID,
        hostname: node.Description.Hostname,
        role: node.Spec.Role,
        availability: node.Spec.Availability,
        state: node.Status.State,
        labels: node.Spec.Labels,
    }));
}

async function getServices() {
    const services = await docker.listServices();
    return services.map((service: any) => ({
        id: service.ID,
        name: service.Spec.Name,
    }));
}

async function moveServiceToNode(serviceName: string, targetNodeLabel: string) {
    console.log(`Attempting to move service "${serviceName}" to nodes with label "${targetNodeLabel}"`);

    const nodes = await getNodes();
    const targetNode = nodes.find((node) => node.labels.type === targetNodeLabel);

    if (!targetNode) {
        console.error(`No target node found with label: ${targetNodeLabel}`);
        return;
    }

    // Update the service placement
    const services = await getServices();
    const service = services.find((s) => s.name === serviceName);

    if (!service) {
        console.error(`Service "${serviceName}" not found.`);
        return;
    }

    const serviceInstance = docker.getService(service.id);
    const serviceDetails = await serviceInstance.inspect();

    // Update placement constraints to point to the target node
    const updatedSpec = serviceDetails.Spec;
    updatedSpec.TaskTemplate.Placement = {
        Constraints: [`node.labels.type == ${targetNodeLabel}`],
    };

    console.log(`Updating service "${serviceName}" to prefer node: ${targetNode.hostname}`);
    await serviceInstance.update({
        version: serviceDetails.Version.Index,
        ...updatedSpec,
    });

    console.log(`Service "${serviceName}" has been moved to ${targetNode.hostname}`);
}

async function monitorSwarm() {
    console.log('Starting Swarm Monitor...');

    while (true) {
        try {
            const nodes = await getNodes();
            const primaryNode = nodes.find((node) => node.labels.type === PRIMARY_LABEL);
            const services = await getServices();

            if (!primaryNode || primaryNode.state !== 'ready') {
                console.warn(`Primary node is unavailable. Moving services to secondary node.`);

                for (const service of services) {
                    await moveServiceToNode(service.name, SECONDARY_LABEL);
                }
            } else {
                console.log(`Primary node "${primaryNode.hostname}" is healthy.`);
            }

            await new Promise((resolve) => setTimeout(resolve, 5000)); // Monitor every 5 seconds
        } catch (err) {
            console.error('Error during monitoring:', err);
        }
    }
}

monitorSwarm();

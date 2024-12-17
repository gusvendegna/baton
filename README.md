# baton: Docker Node Failure Detection and Service Migration

## Overview
baton is a TypeScript-based application that enhances fault tolerance in Docker Swarm environments. It continuously monitors the health of Swarm nodes and automatically migrates services to a backup node if the primary node becomes unavailable.

This tool leverages the Docker API and custom placement constraints to ensure high availability and smooth failover of containerized applications.

---

## Features
- **Node Health Monitoring**: Detects node failures or changes in availability.
- **Service Migration**: Dynamically reassigns services to a secondary node during failures.
- **Docker API Integration**: Uses the Docker socket for real-time interaction with Swarm.
- **Customizable Node Preferences**: Easily configure primary and secondary nodes with labels.
- **TypeScript Powered**: Clean, maintainable, and strongly-typed codebase.

---

## Architecture
1. **Primary Node Monitoring**: The monitor detects if the primary node (labeled `type=primary`) is unhealthy or unavailable.
2. **Service Inspection**: Queries the Docker API to identify services deployed on the primary node.
3. **Service Migration**: Updates the service’s placement constraints to move it to the backup node (labeled `type=secondary`).

---

### Running in Docker

#### 1. Build the Docker Image
```bash
docker build -t baton:latest .
```

#### 2. Deploy the Monitor in Swarm
Create a `docker-compose.yml` file:
```yaml
services:
  baton:
    image: baton:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    deploy:
      replicas: 1
    environment:
      - PRIMARY_LABEL=primary
      - SECONDARY_LABEL=secondary
```
Deploy the stack:
```bash
docker stack deploy -c docker-compose.yml monitor-stack
```

---

## How to Use

### Label Your Nodes
Assign labels to your Swarm nodes for primary and secondary roles.

1. **Label the Primary Node**:
   ```bash
   docker node update --label-add type=primary <primary-node-id>
   ```
2. **Label the Secondary Node**:
   ```bash
   docker node update --label-add type=secondary <secondary-node-id>
   ```

### Test the Monitor
1. Deploy a test service:
   ```bash
   docker service create --name test-service --replicas 1 --constraint 'node.labels.type == primary' nginx
   ```
2. Simulate a failure on the primary node:
   ```bash
   docker node update --availability drain <primary-node-id>
   ```
3. Observe the monitor logs and ensure the service is reassigned to the secondary node:
   ```bash
docker service logs monitor-stack_baton
   ```

---

## Configuration
### Environment Variables
- `PRIMARY_LABEL`: The label identifying the primary node. Default: `primary`.
- `SECONDARY_LABEL`: The label identifying the secondary node. Default: `secondary`.

---

## Development
### Compile TypeScript to JavaScript
```bash
npm run build
```
The output will be in the `dist` folder.

### Run Tests
Add tests using your preferred framework (e.g., Mocha, Jest):
```bash
npm test
```

---

## Roadmap
- Add support for multi-node placement strategies.
- Improve failover logic with configurable priorities.
- Include a web dashboard for real-time monitoring.
- Add unit and integration tests.

---

## Contributing
We welcome contributions! Please follow these steps:
1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m 'Add feature-name'`.
4. Push to the branch: `git push origin feature-name`.
5. Submit a pull request.

---

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgements
- [Dockerode](https://github.com/apocas/dockerode) - Docker SDK for Node.js.
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript at scale.

---

## Contact
For questions or feedback, feel free to open an issue or reach out via email at `your-email@example.com`.


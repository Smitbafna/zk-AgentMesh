const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_, res) => {
  res.send('ZK-AgentMesh Backend is Live');
});

app.post('/deploy', async (req, res) => {
  const agent = req.body;

  if (!agent || !agent.name || !agent.description || !agent.endpoint) {
    return res.status(400).json({ error: 'Missing agent metadata' });
  }

  try {
    const slug = agent.name.toLowerCase().replace(/\s+/g, '-');
    const agentDir = path.join(__dirname, 'agents', slug);
    fs.mkdirSync(agentDir, { recursive: true });

    const dockerfileContent = `
      FROM node:18-alpine
      WORKDIR /app
      COPY . .
      RUN npm install && npm run build
      EXPOSE 3000
      CMD ["npm", "start"]
    `;

    fs.writeFileSync(path.join(agentDir, 'Dockerfile'), dockerfileContent.trim());

    const deployYaml = `
version: "2.0"
services:
  web:
    image: ${process.env.DOCKERHUB_USERNAME}/${slug}
    expose:
      - port: 3000
        as: 80
        to:
          - global: true

profiles:
  compute:
    web:
      resources:
        cpu:
          units: 0.1
        memory:
          size: 512Mi
        storage:
          size: 512Mi
  placement:
    westcoast:
      pricing:
        web:
          denom: uakt
          amount: 1000000

deployment:
  web:
    westcoast:
      profile: web
      count: 1
    `;

    fs.writeFileSync(path.join(agentDir, 'deploy.yml'), deployYaml);

    const dockerImage = `${process.env.DOCKERHUB_USERNAME}/${slug}`;
    const dockerBuildCmd = `docker build -t ${dockerImage} ${agentDir}`;
    const dockerPushCmd = `docker push ${dockerImage}`;

    // Optional: login with DockerHub CLI beforehand or inject credentials

    exec(`${dockerBuildCmd} && ${dockerPushCmd}`, (err, stdout, stderr) => {
      if (err) {
        console.error('Docker error:', stderr);
        return res.status(500).json({ error: 'Docker build/push failed', details: stderr });
      }

      // Here you'd use Akash CLI to deploy with the generated `deploy.yml`
      // Optionally: `akash tx deployment create deploy.yml --from $KEY_NAME`

      return res.status(200).json({
        message: 'Docker image built and pushed. Ready for Akash deploy.',
        image: dockerImage,
        deployYamlPath: path.join(agentDir, 'deploy.yml'),
      });
    });
  } catch (error) {
    console.error('Deployment error:', error);
    return res.status(500).json({ error: 'Deployment failed', details: error.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
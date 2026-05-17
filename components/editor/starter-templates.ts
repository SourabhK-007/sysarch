import { CanvasNode, CanvasEdge } from '@/types/canvas';

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: 'microservices',
    name: 'Microservices Architecture',
    description: 'A standard distributed system with an API Gateway, dedicated application services for core domains, and database endpoints.',
    nodes: [
      {
        id: 'api-gateway',
        type: 'canvasNode',
        position: { x: 100, y: 150 },
        style: { width: 120, height: 60 },
        data: {
          label: 'API Gateway',
          color: '#1F1F1F', // neutral
          shape: 'rectangle',
        },
      },
      {
        id: 'auth-service',
        type: 'canvasNode',
        position: { x: 300, y: 50 },
        style: { width: 120, height: 50 },
        data: {
          label: 'Auth Service',
          color: '#2E1938', // purple
          shape: 'pill',
        },
      },
      {
        id: 'user-service',
        type: 'canvasNode',
        position: { x: 300, y: 150 },
        style: { width: 120, height: 50 },
        data: {
          label: 'User Service',
          color: '#10233D', // blue
          shape: 'pill',
        },
      },
      {
        id: 'payment-service',
        type: 'canvasNode',
        position: { x: 300, y: 250 },
        style: { width: 120, height: 50 },
        data: {
          label: 'Payment Service',
          color: '#062822', // teal
          shape: 'pill',
        },
      },
      {
        id: 'user-db',
        type: 'canvasNode',
        position: { x: 500, y: 125 },
        style: { width: 90, height: 100 },
        data: {
          label: 'User DB',
          color: '#10233D', // blue
          shape: 'cylinder',
        },
      },
      {
        id: 'stripe-api',
        type: 'canvasNode',
        position: { x: 500, y: 250 },
        style: { width: 100, height: 100 },
        data: {
          label: 'Stripe API',
          color: '#3A1726', // pink
          shape: 'hexagon',
        },
      },
    ],
    edges: [
      {
        id: 'edge-gateway-auth',
        type: 'canvasEdge',
        source: 'api-gateway',
        target: 'auth-service',
        sourceHandle: 'right',
        targetHandle: 'left',
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
      {
        id: 'edge-gateway-user',
        type: 'canvasEdge',
        source: 'api-gateway',
        target: 'user-service',
        sourceHandle: 'right',
        targetHandle: 'left',
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
      {
        id: 'edge-gateway-payment',
        type: 'canvasEdge',
        source: 'api-gateway',
        target: 'payment-service',
        sourceHandle: 'right',
        targetHandle: 'left',
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
      {
        id: 'edge-user-db',
        type: 'canvasEdge',
        source: 'user-service',
        target: 'user-db',
        sourceHandle: 'right',
        targetHandle: 'left',
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
      {
        id: 'edge-payment-stripe',
        type: 'canvasEdge',
        source: 'payment-service',
        target: 'stripe-api',
        sourceHandle: 'right',
        targetHandle: 'left',
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
    ],
  },
  {
    id: 'event-driven',
    name: 'Event-Driven Architecture',
    description: 'Asynchronous event ingestion using a central Kafka broker and decoupled consumers publishing analytics and archiving data.',
    nodes: [
      {
        id: 'client-app',
        type: 'canvasNode',
        position: { x: 50, y: 150 },
        style: { width: 120, height: 60 },
        data: {
          label: 'Client App',
          color: '#1F1F1F', // neutral
          shape: 'rectangle',
        },
      },
      {
        id: 'ingest-service',
        type: 'canvasNode',
        position: { x: 230, y: 155 },
        style: { width: 120, height: 50 },
        data: {
          label: 'Ingest Service',
          color: '#10233D', // blue
          shape: 'pill',
        },
      },
      {
        id: 'kafka-broker',
        type: 'canvasNode',
        position: { x: 410, y: 130 },
        style: { width: 100, height: 100 },
        data: {
          label: 'Kafka Broker',
          color: '#331B00', // orange
          shape: 'hexagon',
        },
      },
      {
        id: 'analytics-engine',
        type: 'canvasNode',
        position: { x: 580, y: 50 },
        style: { width: 130, height: 50 },
        data: {
          label: 'Analytics Engine',
          color: '#062822', // teal
          shape: 'pill',
        },
      },
      {
        id: 'notifier',
        type: 'canvasNode',
        position: { x: 580, y: 155 },
        style: { width: 120, height: 50 },
        data: {
          label: 'Notifier',
          color: '#3A1726', // pink
          shape: 'pill',
        },
      },
      {
        id: 'data-archiver',
        type: 'canvasNode',
        position: { x: 580, y: 260 },
        style: { width: 120, height: 50 },
        data: {
          label: 'Data Archiver',
          color: '#0F2E18', // green
          shape: 'pill',
        },
      },
      {
        id: 'timescaledb',
        type: 'canvasNode',
        position: { x: 780, y: 25 },
        style: { width: 95, height: 100 },
        data: {
          label: 'TimescaleDB',
          color: '#062822', // teal
          shape: 'cylinder',
        },
      },
      {
        id: 's3-lake',
        type: 'canvasNode',
        position: { x: 780, y: 235 },
        style: { width: 95, height: 100 },
        data: {
          label: 'S3 Lake',
          color: '#0F2E18', // green
          shape: 'cylinder',
        },
      },
    ],
    edges: [
      {
        id: 'edge-client-ingest',
        type: 'canvasEdge',
        source: 'client-app',
        target: 'ingest-service',
        sourceHandle: 'right',
        targetHandle: 'left',
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
      {
        id: 'edge-ingest-kafka',
        type: 'canvasEdge',
        source: 'ingest-service',
        target: 'kafka-broker',
        sourceHandle: 'right',
        targetHandle: 'left',
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
      {
        id: 'edge-kafka-analytics',
        type: 'canvasEdge',
        source: 'kafka-broker',
        target: 'analytics-engine',
        sourceHandle: 'right',
        targetHandle: 'left',
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
      {
        id: 'edge-kafka-notifier',
        type: 'canvasEdge',
        source: 'kafka-broker',
        target: 'notifier',
        sourceHandle: 'right',
        targetHandle: 'left',
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
      {
        id: 'edge-kafka-archiver',
        type: 'canvasEdge',
        source: 'kafka-broker',
        target: 'data-archiver',
        sourceHandle: 'right',
        targetHandle: 'left',
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
      {
        id: 'edge-analytics-db',
        type: 'canvasEdge',
        source: 'analytics-engine',
        target: 'timescaledb',
        sourceHandle: 'right',
        targetHandle: 'left',
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
      {
        id: 'edge-archiver-s3',
        type: 'canvasEdge',
        source: 'data-archiver',
        target: 's3-lake',
        sourceHandle: 'right',
        targetHandle: 'left',
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
    ],
  },
  {
    id: 'cicd-pipeline',
    name: 'CI/CD Deployment Pipeline',
    description: 'Continuous integration and deployment workflow linking automated Docker builds, test runners, and Kubernetes production clusters.',
    nodes: [
      {
        id: 'git-push',
        type: 'canvasNode',
        position: { x: 50, y: 100 },
        style: { width: 80, height: 80 },
        data: {
          label: 'Git Push',
          color: '#0F2E18', // green
          shape: 'circle',
        },
      },
      {
        id: 'ci-webhook',
        type: 'canvasNode',
        position: { x: 190, y: 90 },
        style: { width: 100, height: 100 },
        data: {
          label: 'CI Webhook?',
          color: '#1F1F1F', // neutral
          shape: 'diamond',
        },
      },
      {
        id: 'docker-build',
        type: 'canvasNode',
        position: { x: 355, y: 115 },
        style: { width: 120, height: 50 },
        data: {
          label: 'Docker Build',
          color: '#10233D', // blue
          shape: 'pill',
        },
      },
      {
        id: 'test-suite',
        type: 'canvasNode',
        position: { x: 535, y: 90 },
        style: { width: 100, height: 100 },
        data: {
          label: 'Test Suite',
          color: '#2E1938', // purple
          shape: 'hexagon',
        },
      },
      {
        id: 'k8s-deploy',
        type: 'canvasNode',
        position: { x: 700, y: 115 },
        style: { width: 120, height: 50 },
        data: {
          label: 'K8s Deploy',
          color: '#331B00', // orange
          shape: 'pill',
        },
      },
      {
        id: 'prod-cluster',
        type: 'canvasNode',
        position: { x: 880, y: 90 },
        style: { width: 95, height: 100 },
        data: {
          label: 'Prod Cluster',
          color: '#062822', // teal
          shape: 'cylinder',
        },
      },
    ],
    edges: [
      {
        id: 'edge-git-webhook',
        type: 'canvasEdge',
        source: 'git-push',
        target: 'ci-webhook',
        sourceHandle: 'right',
        targetHandle: 'left',
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
      {
        id: 'edge-webhook-build',
        type: 'canvasEdge',
        source: 'ci-webhook',
        target: 'docker-build',
        sourceHandle: 'right',
        targetHandle: 'left',
        data: { label: 'Yes' },
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
      {
        id: 'edge-build-test',
        type: 'canvasEdge',
        source: 'docker-build',
        target: 'test-suite',
        sourceHandle: 'right',
        targetHandle: 'left',
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
      {
        id: 'edge-test-deploy',
        type: 'canvasEdge',
        source: 'test-suite',
        target: 'k8s-deploy',
        sourceHandle: 'right',
        targetHandle: 'left',
        data: { label: 'Pass' },
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
      {
        id: 'edge-deploy-prod',
        type: 'canvasEdge',
        source: 'k8s-deploy',
        target: 'prod-cluster',
        sourceHandle: 'right',
        targetHandle: 'left',
        style: { stroke: 'var(--border-subtle)', strokeWidth: 1.5 },
      },
    ],
  },
];

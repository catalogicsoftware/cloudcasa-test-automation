import { parse as parseYaml } from 'yaml';

type K8sContainer = { image?: string };
type K8sPodSpec = {
  containers?: K8sContainer[];
  imagePullSecrets?: { name?: string }[];
};
type K8sManifestItem = {
  kind?: string;
  metadata?: { name?: string };
  spec?: { template?: { spec?: K8sPodSpec } };
};
type K8sManifestList = { items?: K8sManifestItem[] };

const WORKLOAD_KINDS = ['Deployment', 'DaemonSet', 'StatefulSet'];

/** The install manifest is a `kind: List` of every resource the agent needs. */
export function parseInstallManifest(manifestYaml: string): K8sManifestItem[] {
  const manifest = parseYaml(manifestYaml) as K8sManifestList;
  if (!manifest.items?.length) {
    throw new Error('The install manifest has no items');
  }
  return manifest.items;
}

/** The one workload that runs the agent container — everything else in the list is RBAC/namespace scaffolding. */
export function findAgentPodSpec(items: K8sManifestItem[]): K8sPodSpec {
  const workload = items.find(item => WORKLOAD_KINDS.includes(item.kind ?? ''));
  const podSpec = workload?.spec?.template?.spec;
  if (!podSpec) {
    throw new Error(`No ${WORKLOAD_KINDS.join('/')} with a pod spec found in the manifest`);
  }
  return podSpec;
}

export function findAgentImage(podSpec: K8sPodSpec): string {
  const image = podSpec.containers?.[0]?.image;
  if (!image) {
    throw new Error('The agent pod spec has no container image');
  }
  return image;
}

export function podSpecPullSecretNames(podSpec: K8sPodSpec): string[] {
  return (podSpec.imagePullSecrets ?? []).map(secret => secret.name ?? '').filter(Boolean);
}

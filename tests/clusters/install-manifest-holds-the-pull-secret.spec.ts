import { expect, test } from '@fixtures/auth';
import { testResourceName } from '@utils/resource-names';
import {
  findAgentImage,
  findAgentPodSpec,
  parseInstallManifest,
  podSpecPullSecretNames,
} from '@utils/agent-manifest';
import { parseImageReference } from '@utils/image-reference';
import { registryHasTag } from '@utils/container-registry';
import { CLUSTERS_LIST_RELOAD_TIMEOUT } from '@data/timeouts';

test.describe('Clusters', () => {
  test('The install manifest holds a pull secret and a good image tag', async ({
    loggedInPage,
    dashboardPage,
    clustersPage,
    request,
    createdClusters,
  }) => {
    // 1. Log in as the admin user.
    await dashboardPage.userHelpModal.closeModal();

    // 2. Register a disposable cluster with an Advanced options "Image pull secret" so the generated manifest has one to carry (CC-549/550/551).
    const clusterName = testResourceName('cluster');
    const pullSecretName = testResourceName('pull-secret');
    await clustersPage.goto('/clusters');
    const sidebar = await clustersPage.openAddClusterSidebar();
    await sidebar.openAdvancedOptions();
    await sidebar.imagePullSecretName.fill(pullSecretName);
    await sidebar.register(clusterName);
    createdClusters.push(clusterName);
    await clustersPage.installClusterDialog.shouldBeOpened();

    // 3. Get the install manifest. Download the file or copy the text of the instructions.
    const manifestUrl = await clustersPage.installClusterDialog.manifestUrl();
    const manifestResponse = await request.get(manifestUrl);
    expect(manifestResponse.ok(), `GET ${manifestUrl} should succeed`).toBe(true);
    const manifestText = await manifestResponse.text();
    await clustersPage.installClusterDialog.close();

    // 4. Parse the YAML text.
    const items = parseInstallManifest(manifestText);
    const podSpec = findAgentPodSpec(items);

    // 5. Make sure that the pod specification of the agent holds imagePullSecrets.
    const pullSecretNames = podSpecPullSecretNames(podSpec);
    expect(pullSecretNames.length, 'agent pod spec should hold imagePullSecrets').toBeGreaterThan(
      0,
    );

    // 6. Make sure that the manifest holds the referenced Secret, or that the Secret is named.
    expect(pullSecretNames, 'imagePullSecrets should name the configured secret').toContain(
      pullSecretName,
    );

    // 7. Read the image reference of the agent.
    const image = findAgentImage(podSpec);

    // 8. Make sure that the reference holds a registry, a repository and a tag.
    const reference = parseImageReference(image);
    expect(reference.registry, 'image reference should have a registry').toBeTruthy();
    expect(reference.repository, 'image reference should have a repository').toBeTruthy();
    expect(reference.tag, 'image reference should have a tag').toBeTruthy();

    // 9. Make sure that no part of the reference is empty.
    for (const [part, value] of Object.entries(reference)) {
      expect(value.trim(), `image reference part "${part}" should not be empty`).not.toBe('');
    }

    // 10. Ask the registry for the manifest of that tag with an HTTP request.
    const tagExists = await registryHasTag(request, reference);

    // 11. Make sure that the registry answers that the tag exists.
    expect(tagExists, `registry "${reference.registry}" should have tag "${reference.tag}"`).toBe(
      true,
    );

    // 12. Make sure that the clusters table holds the new cluster.
    await clustersPage.clustersTable.shouldHaveRow(clusterName, CLUSTERS_LIST_RELOAD_TIMEOUT);

    // Cleanup (13.): createdClusters deletes the cluster through the API after the test.
  });
});

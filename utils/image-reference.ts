export type ImageReference = {
  registry: string;
  repository: string;
  tag: string;
};

const DEFAULT_REGISTRY = 'docker.io';

/**
 * Splits `[registry/]repository:tag` the way Docker itself does: the first path segment is a
 * registry host only when it looks like one (has a dot/colon, or is "localhost") — otherwise the
 * registry defaults to Docker Hub.
 */
export function parseImageReference(image: string): ImageReference {
  const lastColon = image.lastIndexOf(':');
  const lastSlash = image.lastIndexOf('/');
  if (lastColon === -1 || lastColon < lastSlash) {
    throw new Error(`Image reference "${image}" has no tag`);
  }
  const tag = image.slice(lastColon + 1);
  const nameWithoutTag = image.slice(0, lastColon);

  const firstSlash = nameWithoutTag.indexOf('/');
  const firstSegment = firstSlash === -1 ? nameWithoutTag : nameWithoutTag.slice(0, firstSlash);
  const looksLikeRegistry =
    firstSegment === 'localhost' || firstSegment.includes('.') || firstSegment.includes(':');

  return {
    registry: looksLikeRegistry ? firstSegment : DEFAULT_REGISTRY,
    repository: looksLikeRegistry ? nameWithoutTag.slice(firstSlash + 1) : nameWithoutTag,
    tag,
  };
}

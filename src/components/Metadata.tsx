import { useEffect } from "react";
import { getPublicOrigin } from "../config/env";

interface MetadataProps {
  title?: string;
  description?: string;
  pathname?: string;
  url?: string;
  image?: string;
}

const ensureMetaTag = (selector: string, attribute: string, value: string) => {
  const existing = document.head.querySelector(
    selector,
  ) as HTMLMetaElement | null;

  if (existing) {
    existing.setAttribute(attribute, value);
    return existing;
  }

  const element = document.createElement("meta");
  if (selector.startsWith("meta[property=")) {
    element.setAttribute("property", selector.slice(13, -1));
  } else if (selector.startsWith("meta[name=")) {
    element.setAttribute("name", selector.slice(10, -1));
  }
  element.setAttribute(attribute, value);
  document.head.appendChild(element);
  return element;
};

const ensureCanonicalLink = (href: string) => {
  const existing = document.head.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement | null;

  if (existing) {
    existing.setAttribute("href", href);
    return existing;
  }

  const element = document.createElement("link");
  element.setAttribute("rel", "canonical");
  element.setAttribute("href", href);
  document.head.appendChild(element);
  return element;
};

export default function Metadata({
  title,
  description,
  pathname = "/",
  url,
  image,
}: MetadataProps) {
  useEffect(() => {
    const resolvedTitle = title || "SOMI — Read. Discover. Write.";
    const resolvedDescription =
      description ||
      "Discover stories, follow your favorite writers and immerse yourself in books on SOMI.";
    const currentOrigin =
      typeof window !== "undefined"
        ? window.location.origin
        : getPublicOrigin();
    const resolvedUrl = url || new URL(pathname, currentOrigin).toString();
    const resolvedImage =
      image || new URL("/og-image.svg", currentOrigin).toString();

    document.title = resolvedTitle;
    ensureMetaTag('meta[name="description"]', "content", resolvedDescription);
    ensureMetaTag('meta[property="og:title"]', "content", resolvedTitle);
    ensureMetaTag(
      'meta[property="og:description"]',
      "content",
      resolvedDescription,
    );
    ensureMetaTag('meta[property="og:url"]', "content", resolvedUrl);
    ensureMetaTag('meta[property="og:image"]', "content", resolvedImage);
    ensureMetaTag(
      'meta[name="twitter:card"]',
      "content",
      "summary_large_image",
    );
    ensureCanonicalLink(resolvedUrl);
  }, [description, image, pathname, title, url]);

  return null;
}

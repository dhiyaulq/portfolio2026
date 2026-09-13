/**
 * This route mounts Sanity Studio at /studio on your live site.
 * That's your permanent upload dashboard: yoursite.com/studio
 */
import StudioWrapper from "../../../components/StudioWrapper";

export const dynamic = "force-static";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  return <StudioWrapper />;
}

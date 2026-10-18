import { Bookmark } from 'lucide-react'
import { Placeholder } from '@/components/Placeholder'

export default function SwipePage() {
  return (
    <Placeholder title="Swipe File" description="Ads die je als inspiratie bewaart." icon={<Bookmark />} phase={3}>
      Bewaar ads met screenshot of video, transcript en tags, en laat de AI hook, angle, structuur en toepassingsideeën analyseren.
    </Placeholder>
  )
}

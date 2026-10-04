import PlansparencyApp from '@/components/PlansparencyApp';

// Ross's preview: the participant screens with the upload flow switched on.
// Lives under /advisor, so the advisor password in middleware.ts always covers it.
export default function AdvisorPreviewPage() {
  return <PlansparencyApp mode="version-a" allowUpload />;
}

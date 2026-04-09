export const metadata = {
  title: "Privacy Policy – Slacklister",
  description: "Privacy Policy for Slacklister.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Effective Date: April 8, 2026 &middot; Last Updated: April 8, 2026
      </p>

      <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
        <p>
          Slacklister (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) helps
          users create and maintain Spotify playlists based on Spotify links
          shared in selected Slack channels.
        </p>
        <p>
          This Privacy Policy explains what information we collect, how we use
          it, how we store it, and the choices available to users and workspace
          administrators.
        </p>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            1. Information We Collect
          </h2>
          <p className="mt-2">
            When you use Slacklister, we may collect and store the following
            information:
          </p>

          <h3 className="mt-4 text-sm font-semibold text-foreground">
            Slack Account and Workspace Information
          </h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Slack workspace ID and workspace name</li>
            <li>Slack user ID associated with the connected account</li>
            <li>
              OAuth access tokens and, where applicable, refresh tokens
            </li>
            <li>
              Channel metadata for channels you choose to track (channel ID,
              channel name)
            </li>
          </ul>

          <h3 className="mt-4 text-sm font-semibold text-foreground">
            Slack Message Content
          </h3>
          <p className="mt-1">
            For channels you choose to sync, we access message history in order
            to detect Spotify links shared in those channels. We do not use
            Slack message content for advertising or profiling. We access
            message content only to identify Spotify track or album links,
            build or update Spotify playlists, avoid adding duplicate tracks,
            and support manual or incremental resyncs.
          </p>

          <h3 className="mt-4 text-sm font-semibold text-foreground">
            Spotify Account Information
          </h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Spotify user ID</li>
            <li>Spotify display name</li>
            <li>Spotify OAuth access tokens and refresh tokens</li>
            <li>
              Spotify playlist IDs and playlist URLs created or managed through
              the app
            </li>
          </ul>

          <h3 className="mt-4 text-sm font-semibold text-foreground">
            App Usage and Sync Data
          </h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Which Slack channels are being tracked</li>
            <li>Timestamps related to sync activity</li>
            <li>Track URIs extracted from shared Spotify links</li>
            <li>
              Limited metadata needed to manage playlists and prevent duplicates
            </li>
          </ul>

          <h3 className="mt-4 text-sm font-semibold text-foreground">
            Authentication Information
          </h3>
          <p className="mt-1">
            If the app uses email or account authentication, we may also store
            your account ID and email address.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            2. How We Use Information
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Authenticate users with Slack and Spotify</li>
            <li>
              Let users connect their Slack workspace and Spotify account
            </li>
            <li>Let users select which Slack channels to track</li>
            <li>Scan selected Slack channels for Spotify links</li>
            <li>
              Create and update Spotify playlists based on those links
            </li>
            <li>Prevent duplicate playlist entries</li>
            <li>
              Maintain app security, reliability, and performance
            </li>
            <li>Troubleshoot issues and respond to support requests</li>
          </ul>
          <p className="mt-2">
            We process personal data to provide and operate the service, based
            on user consent and our legitimate interest in delivering core
            functionality.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            3. Slack Data Access
          </h2>
          <p className="mt-2">
            Slacklister only accesses Slack data that is necessary for the app
            to function and only within the permissions granted by the user or
            workspace administrator, in accordance with Slack&apos;s API Terms
            of Service. This includes reading channel lists so users can choose
            channels to track, and reading message history from selected
            channels to find Spotify links.
          </p>
          <p className="mt-2">
            We do not sell Slack data, and we do not use Slack data to build
            user profiles unrelated to the app&apos;s core functionality.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            4. Spotify Data Access
          </h2>
          <p className="mt-2">
            We use Spotify account access only to identify the connected
            Spotify user, create playlists, add tracks to playlists, and
            refresh tokens as needed to keep the integration working. We do not
            use Spotify account data for advertising or unrelated analytics.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            5. How We Store and Protect Information
          </h2>
          <p className="mt-2">
            We take reasonable technical and organizational measures to protect
            personal and workspace data. These measures may include encrypted
            storage of third-party access tokens, access controls for backend
            systems and databases, transport encryption (such as HTTPS),
            security headers and application-level protections, and rate
            limiting and other abuse-prevention controls.
          </p>
          <p className="mt-2">
            No method of transmission or storage is 100% secure, so we cannot
            guarantee absolute security. In the event of a data breach, we will
            notify affected users and relevant authorities as required by
            applicable law.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            6. Data Retention
          </h2>
          <p className="mt-2">
            We retain information only as long as necessary to operate the app,
            comply with legal obligations, resolve disputes, and enforce
            agreements. Connected account and integration data is retained while
            the app is actively in use. Tracked channel and playlist mapping
            data is retained while those channels remain connected. If a user
            disconnects the app or requests deletion, we will delete or
            de-identify data within a reasonable period, typically within 30
            days, unless retention is required by law or for legitimate security
            reasons.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            7. Sharing of Information
          </h2>
          <p className="mt-2">We do not sell personal information.</p>
          <p className="mt-2">
            We may share information only in the following circumstances:
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              With service providers and infrastructure vendors that help us
              operate the app
            </li>
            <li>
              With Slack and Spotify as necessary to perform the requested
              integration actions
            </li>
            <li>
              If required by law, legal process, or valid governmental request
            </li>
            <li>
              To protect the rights, safety, and security of our users,
              customers, or systems
            </li>
            <li>
              In connection with a merger, acquisition, financing, or sale of
              assets
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            8. User Rights and Controls
          </h2>
          <p className="mt-2">
            Depending on your location and applicable law, you may have the
            right to access the personal data we hold about you, request
            correction of inaccurate data, request deletion of your data,
            withdraw consent for data processing, and request a copy of your
            data in a portable format.
          </p>
          <p className="mt-2">
            You can exercise these rights by contacting us at{" "}
            <a
              href="mailto:slacklister.support@gmail.com"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              slacklister.support@gmail.com
            </a>
            . You may also disconnect your Slack workspace, disconnect your
            Spotify account, or stop tracking specific Slack channels.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            9. International Data Transfers
          </h2>
          <p className="mt-2">
            If you access the app from outside the country where our systems
            are located, your information may be transferred to and processed
            in other countries. By using the app, you understand that your
            information may be processed in jurisdictions that may have
            different data protection laws than your own.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            10. Children&apos;s Privacy
          </h2>
          <p className="mt-2">
            Slacklister is not directed to children, and we do not knowingly
            collect personal information from children under 13, or under a
            higher age threshold where required by applicable law. If you
            believe a child has provided personal information, contact us so we
            can investigate and take appropriate action.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            11. Changes to This Privacy Policy
          </h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. If we make
            material changes, we will update the &quot;Last Updated&quot; date
            and may provide additional notice where required by law. Your
            continued use of the app after an updated policy becomes effective
            means the updated policy will apply going forward.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            12. Contact Us
          </h2>
          <p className="mt-2">
            If you have questions, requests, or concerns about this Privacy
            Policy or our data practices, contact us at:{" "}
            <a
              href="mailto:slacklister.support@gmail.com"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              slacklister.support@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

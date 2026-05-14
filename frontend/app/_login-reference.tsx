A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:
- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

See more info here: https://nextjs.org/docs/messages/react-hydration-error


  ...
    <LoadingBoundary name="login/" loading={null}>
      <HTTPAccessFallbackBoundary notFound={undefined} forbidden={undefined} unauthorized={undefined}>
        <RedirectBoundary>
          <RedirectErrorBoundary router={{...}}>
            <InnerLayoutRouter url="/login" tree={[...]} params={{}} cacheNode={{rsc:<Fragment>, ...}} ...>
              <SegmentViewNode type="page" pagePath="(auth)/log...">
                <SegmentTrieNode>
                <ClientPageRoot Component={function LoginPage} serverProvidedParams={{...}}>
                  <LoginPage params={Promise} searchParams={Promise}>
                    <div className="flex min-h...">
                      <div className="flex w-ful...">
                        <div className="mx-auto w-...">
                          <LinkComponent>
                          <div>
                          <form onSubmit={function handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                              <label>
                              <_c id="username" type="email" placeholder="admin@fact..." value="" ...>
                                <input
                                  type="email"
                                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring..."
                                  ref={null}
                                  id="username"
                                  placeholder="admin@factory.com"
                                  value=""
                                  onChange={function onChange}
                                  disabled={false}
                                  autoComplete="email"
-                                 fdprocessedid="topvt8"
                                >
                            <div className="space-y-2">
                              <label>
                              <div className="relative">
                                <_c id="password" type="password" placeholder="••••••••" value="" ...>
                                  <input
                                    type="password"
                                    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ri..."
                                    ref={null}
                                    id="password"
                                    placeholder="••••••••"
                                    value=""
                                    onChange={function onChange}
                                    disabled={false}
                                    autoComplete="current-password"
-                                   fdprocessedid="v5vq7"
                                  >
                                ...
                            ...
                          <div className="mt-8 round...">
                            <div>
                            <p>
                            <div className="space-y-2">
                              <button
                                onClick={function onClick}
                                className="w-full rounded-lg bg-secondary p-3 text-left text-sm transition-colors hove..."
-                               fdprocessedid="x2vanb"
                              >
                              <button
                                onClick={function onClick}
                                className="w-full rounded-lg bg-secondary p-3 text-left text-sm transition-colors hove..."
-                               fdprocessedid="571n4"
                              >
                          ...
                      ...
              ...
            ...
Call Stack
17

Show 16 ignore-listed frame(s)
input
<anonymous>
1
2

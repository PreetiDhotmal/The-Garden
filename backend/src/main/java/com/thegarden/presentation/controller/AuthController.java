package com.thegarden.presentation.controller;

import com.thegarden.infrastructure.auth.OAuthStateStore;
import com.thegarden.infrastructure.auth.PkceGenerator;
import com.thegarden.infrastructure.auth.YouVersionOAuthClient;
import com.thegarden.infrastructure.auth.YouVersionTokenResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Auth", description = "Optional 'Sign in with YouVersion' account linking — not required to browse/read scripture")
public class AuthController {

    private final PkceGenerator pkceGenerator;
    private final OAuthStateStore stateStore;
    private final YouVersionOAuthClient oauthClient;
    private final JwtDecoder jwtDecoder;

    public AuthController(
            PkceGenerator pkceGenerator,
            OAuthStateStore stateStore,
            YouVersionOAuthClient oauthClient,
            JwtDecoder jwtDecoder) {
        this.pkceGenerator = pkceGenerator;
        this.stateStore = stateStore;
        this.oauthClient = oauthClient;
        this.jwtDecoder = jwtDecoder;
    }

    @Operation(summary = "Get the URL to redirect the browser to for YouVersion sign-in")
    @GetMapping("/api/auth/youversion/authorize-url")
    public AuthorizeUrlResponse getAuthorizeUrl() {
        PkceGenerator.PkcePair pkce = pkceGenerator.generate();
        String state = pkceGenerator.generateState();
        stateStore.put(state, pkce.codeVerifier());
        String authorizeUrl = oauthClient.buildAuthorizeUrl(state, pkce.codeChallenge());
        return new AuthorizeUrlResponse(authorizeUrl, state);
    }

    @Operation(summary = "Exchange the authorization code from YouVersion's callback for a session")
    @PostMapping("/api/auth/youversion/callback")
    public SessionResponse handleCallback(@Valid @RequestBody OAuthCallbackRequest request) {
        String codeVerifier = stateStore.consume(request.state())
                .orElseThrow(() -> new IllegalArgumentException("Unknown or expired OAuth state."));
        YouVersionTokenResult result = oauthClient.exchangeCodeForTokens(request.code(), codeVerifier);
        return toSessionResponse(result);
    }

    @Operation(summary = "Refresh an expired access token")
    @PostMapping("/api/auth/youversion/refresh")
    public SessionResponse refresh(@Valid @RequestBody RefreshRequest request) {
        YouVersionTokenResult result = oauthClient.refresh(request.refreshToken());
        return toSessionResponse(result);
    }

    @Operation(summary = "Logout — stateless on our side; the frontend simply discards its tokens")
    @PostMapping("/api/auth/youversion/logout")
    public void logout() {
        // No server-side session to invalidate: we issue no cookies/sessions
        // of our own for this flow, only pass through YouVersion's tokens.
        // This endpoint exists for API symmetry and as a seam for a future
        // token-revocation call if YouVersion adds one.
    }

    private SessionResponse toSessionResponse(YouVersionTokenResult result) {
        Jwt idToken = jwtDecoder.decode(result.idToken());
        String displayName = idToken.getClaimAsString("name");
        return new SessionResponse(
                result.accessToken(), result.refreshToken(), result.expiresInSeconds(), displayName);
    }
}

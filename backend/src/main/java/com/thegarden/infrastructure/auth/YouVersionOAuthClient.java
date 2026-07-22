package com.thegarden.infrastructure.auth;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class YouVersionOAuthClient {

    private final YouVersionOAuthProperties properties;
    private final RestClient restClient;

    public YouVersionOAuthClient(YouVersionOAuthProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.create();
    }

    /** Builds the URL the frontend redirects the browser to. The PKCE code_verifier is generated and stored by the caller (AuthController), not here. */
    public String buildAuthorizeUrl(String state, String codeChallenge) {
        return UriComponentsBuilder.fromUriString(properties.authorizeUrl())
                .queryParam("response_type", "code")
                .queryParam("client_id", properties.clientId())
                .queryParam("redirect_uri", properties.redirectUri())
                .queryParam("state", state)
                .queryParam("code_challenge", codeChallenge)
                .queryParam("code_challenge_method", "S256")
                .queryParam("scope", "openid profile")
                .build()
                .toUriString();
    }

    public YouVersionTokenResult exchangeCodeForTokens(String code, String codeVerifier) {
        YouVersionTokenResponse response = restClient.post()
                .uri(properties.tokenUrl())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(
                        "grant_type=authorization_code"
                                + "&code=" + code
                                + "&redirect_uri=" + properties.redirectUri()
                                + "&client_id=" + properties.clientId()
                                + "&code_verifier=" + codeVerifier)
                .retrieve()
                .body(YouVersionTokenResponse.class);
        return toResult(response);
    }

    public YouVersionTokenResult refresh(String refreshToken) {
        YouVersionTokenResponse response = restClient.post()
                .uri(properties.tokenUrl())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(
                        "grant_type=refresh_token"
                                + "&refresh_token=" + refreshToken
                                + "&client_id=" + properties.clientId())
                .retrieve()
                .body(YouVersionTokenResponse.class);
        return toResult(response);
    }

    private YouVersionTokenResult toResult(YouVersionTokenResponse response) {
        if (response == null) {
            throw new IllegalStateException("YouVersion token endpoint returned an empty response.");
        }
        return new YouVersionTokenResult(
                response.accessToken(),
                response.refreshToken(),
                response.idToken(),
                response.expiresInSeconds());
    }
}

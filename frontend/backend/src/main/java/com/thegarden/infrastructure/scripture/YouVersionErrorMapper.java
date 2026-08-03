package com.thegarden.infrastructure.scripture;

import com.thegarden.domain.scripture.ScriptureNotFoundException;
import com.thegarden.domain.scripture.ScriptureProviderException;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;

/**
 * Translates YouVersion's documented HTTP status codes (see
 * developers.youversion.com/error-codes) into our domain exceptions.
 * 5xx and network-level failures are retryable; 4xx are not, since
 * retrying a malformed request or bad credentials just reproduces the
 * same failure.
 */
@Component
public class YouVersionErrorMapper {

    public RuntimeException map(RestClientResponseException exception, String context) {
        HttpStatusCode status = exception.getStatusCode();

        if (status.value() == 404) {
            return new ScriptureNotFoundException("YouVersion resource not found: " + context);
        }
        if (status.value() == 401) {
            return new ScriptureProviderException(
                    "YouVersion rejected the App Key — check YVP_APP_KEY configuration.", false, exception);
        }
        if (status.value() == 400 || status.value() == 406) {
            return new ScriptureProviderException(
                    "YouVersion rejected the request: " + context, false, exception);
        }
        if (status.value() == 429) {
            return new ScriptureProviderException("YouVersion rate limit exceeded.", true, exception);
        }
        if (status.is5xxServerError()) {
            return new ScriptureProviderException(
                    "YouVersion service error while fetching " + context, true, exception);
        }
        return new ScriptureProviderException(
                "Unexpected YouVersion response (" + status.value() + ") for " + context, false, exception);
    }

    public RuntimeException mapNetworkFailure(String context, Throwable cause) {
        return new ScriptureProviderException("Network failure contacting YouVersion for " + context, true, cause);
    }
}

package com.thegarden.presentation.controller;

import jakarta.validation.constraints.NotBlank;

public record OAuthCallbackRequest(@NotBlank String code, @NotBlank String state) {
}

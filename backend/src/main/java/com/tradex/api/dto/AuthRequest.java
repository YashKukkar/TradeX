package com.tradex.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthRequest(

        @NotBlank(message = "Please enter your email address") @Email(message = "Please enter a valid email address format") String email,

        @NotBlank(message = "Please enter your password") @Size(max = 128, message = "Password cannot be longer than 128 characters") String password

) {
}

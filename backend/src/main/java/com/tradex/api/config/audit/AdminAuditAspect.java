package com.tradex.api.config.audit;

import com.tradex.api.entity.AdminAuditLog;
import com.tradex.api.entity.User;
import com.tradex.api.repository.AdminAuditLogRepository;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.dto.UserDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminAuditAspect {

    private final UserRepository userRepository;
    private final AdminAuditLogRepository auditLogRepository;
    private final ExpressionParser parser = new SpelExpressionParser();

    @AfterReturning(value = "@annotation(adminAudited)", returning = "result")
    public void auditAction(JoinPoint joinPoint, AdminAudited adminAudited, Object result) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        String adminEmail = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            adminEmail = auth.getName();
        }

        Long targetUserId = null;

        for (int i = 0; i < parameterNames.length; i++) {
            if ("userId".equals(parameterNames[i]) || "id".equals(parameterNames[i]) || "employeeId".equals(parameterNames[i])) {
                targetUserId = (Long) args[i];
            } else if (adminEmail == null && "adminEmail".equals(parameterNames[i])) {
                adminEmail = (String) args[i];
            }
        }

        if (targetUserId == null && result instanceof UserDTO) {
            targetUserId = ((UserDTO) result).id();
        }

        if (adminEmail == null || targetUserId == null) {
            log.warn("AOP Auditing bypassed: adminEmail ({}) or target userId ({}) not found.", adminEmail, targetUserId);
            return;
        }

        User actor = userRepository.findByEmail(adminEmail).orElse(null);
        User target = userRepository.findById(targetUserId).orElse(null);

        if (actor == null || target == null) {
            log.warn("AOP Auditing bypassed: Actor or Target User entity could not be retrieved.");
            return;
        }

        String details = adminAudited.details();
        if (!details.isBlank()) {
            StandardEvaluationContext context = new StandardEvaluationContext();
            for (int i = 0; i < parameterNames.length; i++) {
                context.setVariable(parameterNames[i], args[i]);
            }
            context.setVariable("target", target);
            context.setVariable("actor", actor);
            context.setVariable("result", result);
            try {
                details = parser.parseExpression(details).getValue(context, String.class);
            } catch (Exception e) {
                log.error("Failed to parse SpEL expression for admin audit log: {}", e.getMessage());
                details = "Action performed. SpEL evaluation error: " + e.getMessage();
            }
        } else {
            details = adminAudited.action().name() + " action performed";
        }

        AdminAuditLog auditLog = new AdminAuditLog(actor, target, adminAudited.action(), details);
        auditLogRepository.save(auditLog);
        log.info("AOP Audit recorded: [{}] by [{}] on [{}]", adminAudited.action(), adminEmail, target.getEmail());
    }
}

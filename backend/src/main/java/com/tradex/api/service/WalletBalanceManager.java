package com.tradex.api.service;

import com.tradex.api.entity.User;
import com.tradex.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WalletBalanceManager {

    private final UserRepository userRepository;

    @Transactional(propagation = Propagation.MANDATORY)
    public User mutateWithdrawableBalance(User user, BigDecimal delta) {
        BigDecimal current = user.getWithdrawableBalance() != null ? user.getWithdrawableBalance() : BigDecimal.ZERO;
        BigDecimal newBalance = current.add(delta);
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Insufficient withdrawable balance (current: " + current + ", requested deduction: " + delta.negate() + ")");
        }
        user.setWithdrawableBalance(newBalance);
        return userRepository.save(user);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public User mutateBonusBalance(User user, BigDecimal delta) {
        BigDecimal current = user.getBonusBalance() != null ? user.getBonusBalance() : BigDecimal.ZERO;
        BigDecimal newBalance = current.add(delta);
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Insufficient bonus balance (current: " + current + ", requested deduction: " + delta.negate() + ")");
        }
        user.setBonusBalance(newBalance);
        return userRepository.save(user);
    }
}

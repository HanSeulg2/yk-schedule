package com.yk.schedule.model;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class Employee {
    private String id; // Document ID
    private String name;
    private int wage;
    private boolean isResigned;
    private boolean isHolidayAllowance;
    private boolean isExcludeSalary;
    // Add other fields as necessary
}

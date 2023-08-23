-- phpMyAdmin SQL Dump
-- version 5.1.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 23, 2023 at 04:18 AM
-- Server version: 10.4.18-MariaDB
-- PHP Version: 8.0.3

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bm`
--

-- --------------------------------------------------------

--
-- Table structure for table `adsaccount`
--

CREATE TABLE `adsaccount` (
  `id` int(11) NOT NULL,
  `adAccount` varchar(255) NOT NULL,
  `bmId` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `bmToken` text NOT NULL,
  `createdat` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `business_managers`
--

CREATE TABLE `business_managers` (
  `id` int(11) NOT NULL,
  `bm_name` varchar(255) NOT NULL,
  `account_id` varchar(255) NOT NULL,
  `token` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `error_logs`
--

CREATE TABLE `error_logs` (
  `id` int(11) NOT NULL,
  `timestamp` datetime NOT NULL,
  `error_message` text NOT NULL,
  `db_timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `spendinfo_final`
--

CREATE TABLE `spendinfo_final` (
  `id` int(11) NOT NULL,
  `account_name` varchar(255) DEFAULT NULL,
  `id_account` varchar(255) DEFAULT NULL,
  `bm_name` varchar(255) DEFAULT NULL,
  `bm_id` varchar(255) DEFAULT NULL,
  `total_amount_spent` varchar(255) DEFAULT NULL,
  `spend_cap` varchar(255) DEFAULT NULL,
  `timezone` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `currency` varchar(255) DEFAULT NULL,
  `line_credit_payment_method` varchar(255) DEFAULT NULL,
  `name_line_credit` varchar(255) DEFAULT NULL,
  `date_of_spent_start` varchar(255) DEFAULT NULL,
  `date_of_spent_stop` varchar(255) NOT NULL,
  `spent_of_the_day` varchar(50) DEFAULT NULL,
  `createdat` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `spendinfo_temp`
--

CREATE TABLE `spendinfo_temp` (
  `id` int(11) NOT NULL,
  `account_name` varchar(255) DEFAULT NULL,
  `id_account` varchar(255) DEFAULT NULL,
  `bm_name` varchar(255) DEFAULT NULL,
  `bm_id` varchar(255) DEFAULT NULL,
  `total_amount_spent` varchar(255) DEFAULT NULL,
  `spend_cap` varchar(255) DEFAULT NULL,
  `timezone` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `currency` varchar(255) DEFAULT NULL,
  `line_credit_payment_method` varchar(255) DEFAULT NULL,
  `name_line_credit` varchar(255) DEFAULT NULL,
  `date_of_spent_start` varchar(255) DEFAULT NULL,
  `date_of_spent_stop` varchar(255) NOT NULL,
  `spent_of_the_day` varchar(50) DEFAULT NULL,
  `createdat` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `adsaccount`
--
ALTER TABLE `adsaccount`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `business_managers`
--
ALTER TABLE `business_managers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `error_logs`
--
ALTER TABLE `error_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `spendinfo_final`
--
ALTER TABLE `spendinfo_final`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `spendinfo_temp`
--
ALTER TABLE `spendinfo_temp`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `adsaccount`
--
ALTER TABLE `adsaccount`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `business_managers`
--
ALTER TABLE `business_managers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `error_logs`
--
ALTER TABLE `error_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `spendinfo_final`
--
ALTER TABLE `spendinfo_final`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `spendinfo_temp`
--
ALTER TABLE `spendinfo_temp`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- MySQL dump 10.13  Distrib 5.7.17, for Win64 (x86_64)
--
-- Host: alarmdb.mysql.database.azure.com    Database: alarmdb
-- ------------------------------------------------------
-- Server version	5.6.26.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alarmdata`
--

DROP TABLE IF EXISTS `alarmdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `alarmdata` (
  `model` varchar(100) NOT NULL,
  `ID` varchar(50) NOT NULL,
  `description` mediumtext,
  PRIMARY KEY (`model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alarmdata`
--

LOCK TABLES `alarmdata` WRITE;
/*!40000 ALTER TABLE `alarmdata` DISABLE KEYS */;
INSERT INTO `alarmdata` VALUES ('123','[\"123text\",\"234text1\",\"123text3\"]','[\"text\",\"text1測試\",\"text3測試\"]'),('asd','[\"asdtext\",\"asdtext1\"]','[\"text\",\"asdtext1\"]'),('qwe','[\"qwetext\",\"qwetext1\"]','[\"text1\",\"text1\"]'),('zxc','[\"zxczxc\"]','[\"zxczxc\"]');
/*!40000 ALTER TABLE `alarmdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `iddescription`
--

DROP TABLE IF EXISTS `iddescription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `iddescription` (
  `model` varchar(100) NOT NULL,
  `ID` varchar(100) NOT NULL,
  `description` varchar(100) DEFAULT NULL,
  `index` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`index`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `iddescription`
--

LOCK TABLES `iddescription` WRITE;
/*!40000 ALTER TABLE `iddescription` DISABLE KEYS */;
INSERT INTO `iddescription` VALUES ('qwe','qwetext1','text1',35),('asd','asdtext1','asdtext1',36),('qwe','qwetext','text1',37),('123','123text','text',38),('zxc','zxczxc','zxczxc',39),('asd','asdtext','text',40),('123','123text3','text3測試',41),('123','234text1','text1測試',42);
/*!40000 ALTER TABLE `iddescription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subcontain`
--

DROP TABLE IF EXISTS `subcontain`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subcontain` (
  `mid` varchar(40) NOT NULL,
  `ID` mediumtext NOT NULL,
  `model` varchar(100) NOT NULL,
  `index` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`index`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subcontain`
--

LOCK TABLES `subcontain` WRITE;
/*!40000 ALTER TABLE `subcontain` DISABLE KEYS */;
INSERT INTO `subcontain` VALUES ('U9cfa95db81ec3ce7c2cf85e9c2ca85e9','[\"asdtext\",\"asdtext1\"]','asd',27),('U9cfa95db81ec3ce7c2cf85e9c2ca85e9','[\"qwetext\",\"qwetext1\"]','qwe',28),('U9cfa95db81ec3ce7c2cf85e9c2ca85e9','[\"123text\",\"234text1\",\"123text3\"]','123',29),('U9cfa95db81ec3ce7c2cf85e9c2ca85e9','[\"zxczxc\"]','zxc',30),('U18337a89a9ba401c2d0845ef987130b8','[\"123text\"]','123',31);
/*!40000 ALTER TABLE `subcontain` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-05-16  9:55:22
